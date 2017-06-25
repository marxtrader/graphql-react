package com.tradedesksoftware.etsweb.rest;

/*
 * Created on Jan 31, 2012
 *
 * This code is the proprietary confidential property of TradeDesk
 * Software Inc and may not be redistributed or used for any other
 * purpose without the express consent of TradeDesk Software Inc.
 * 
 * Copyright 2012 TradeDesk Software Inc. All Rights Reserved
 */


import java.io.InputStream;
import java.rmi.RemoteException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Properties;
import java.util.Set;

import javax.ejb.EJBException;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

import org.apache.log4j.Logger;

import com.tradedesksoftware.auth.Util;
import com.tradedesksoftware.ets.core.exceptions.ETSAccessException;
import com.tradedesksoftware.etsdata.AccessibleState;
import com.tradedesksoftware.etsdata.DataManager;
import com.tradedesksoftware.etsdata.messages.Message;
import com.tradedesksoftware.etsdata.stock.WatchList;
import com.tradedesksoftware.etsdata.users.Preferences;
import com.tradedesksoftware.etsdata.users.Profile;
import com.tradedesksoftware.etsdata.users.Role;
import com.tradedesksoftware.etsdata.users.User;
import com.tradedesksoftware.etsdata.users.UserFilter;
import com.tradedesksoftware.etsdata.users.UserInfo;
import com.tradedesksoftware.etsdata.users.UserTemplate;
import com.tradedesksoftware.etsdata.users.exceptions.UserManagementException;
import com.tradedesksoftware.etsdata.users.exceptions.UserManagementException.Reason;
import com.tradedesksoftware.etsdata.users.group.Company;
import com.tradedesksoftware.etsdata.users.group.CompanyDivision;
import com.tradedesksoftware.etsweb.soap.WebEndpointHandler;
import com.tradedesksoftware.etsweb.soap.fault.DataManagementFault;

/**
 * 
 * Provides basic data manager functionality via RESTEasy.
 * 
 * As a general note - return plaintext instead of JSON when returning primitives and strings rather than collections
 * or objects.
 * 
 * Browser-side JSON.parse() gets mad when you try to tell it to parse a single value and you're using the 
 * header media type to determine what to parse.
 * 
 * @author nsimpson
 *
 */
@Path("rest")
@Provider // Exception mapper provider
public class DataManagementRESTServices extends Application implements ExceptionMapper<DataManagementFault> {
	private static Logger logger = Logger.getLogger(DataManagementRESTServices.class);
	private DataManager dataManager;
	private InitialContext context;
	
//	private Operations operationsBean;
//	private static String operations;
	
	protected enum ErrorCodes {
		GENERALERROR,		// use only if nothing else can be determined about the error
		ACCESSVIOLATION,	// access was denied, generally reflects ETSAccessException from EJB layer
		USERNOTFOUND,		// an operation was attempted on a non-existent user object
		PROFILENOTFOUND,	// an operation was attempted on a non-existent user profile object
		DUPLICATEUSERNAME,	// attempt to use an existing user name
		ILLEGALINPUT,		// something is not right in the supplied input
		ILLEGALGROUPSTATE,	// the state of a group (department) or company is incorrect
		COMPANYNOTFOUND,	// a company object could not be found
		DEPARTMENTNOTFOUND,	// a department object could not be found
		DUPLICATEHANDLE,	// a profile already exists with this handle
		DUPLICATECOMPANY,	// a company already exists with this name
		DUPLICATEGROUP,		// a group (division) exists with this name
	}

	private static DataManagementFault createDMF(Throwable ume) {
		logger.debug("Something threw error, constructing DMF...",ume);
		if(ume instanceof UserManagementException) {
			
		} else if (ume instanceof ETSAccessException) {
			return new DataManagementFault(ErrorCodes.ACCESSVIOLATION.name(),ume.getMessage());
		} else if (ume instanceof EJBException) {
			if(ume.getCause() instanceof javax.persistence.NoResultException)
				return null;
			else
				return new DataManagementFault(ErrorCodes.GENERALERROR.name(),"Cannot find object");
		}
		return new DataManagementFault(Reason.UNKNOWN.name(),ume.getMessage());
	}
	
	private void init() throws Exception {
		logger.debug( "Init Called" );
		if(context == null) {
			context = new InitialContext();
		}
/* Disabling this until issues with the EAR and dependencies etc can be sorted out correctly. -NS
 * TODO: Fix this WAR so that everything goes through operationsbean correctly!
 * 		HierarchicalConfiguration config = (HierarchicalConfiguration)((ConfigManager) context.lookup("java:/ets/ETSConfigManager")).getConfiguration();
 
		config.setExpressionEngine(new XPathExpressionEngine());
		operations = config.getString("datamanagementwebservice/operationsbean");
		if(operations != null) {// this variable is just fucked, it never works, lol
			operationsBean = (Operations) context.lookup(operations);
		}
*/		
		logger.debug("finished initialization");
	}
	
	private DataManager getDataManager() {
		if (dataManager != null) {
			return dataManager;
		}
		try {
			init(); // establish context.
			dataManager = (DataManager) context.lookup("java:app/ets.data/DataManagerBean"); //TODO: fix the use of configuration file
		} catch (NamingException e) {
			logger.error("Failed to create dataManager from lookup.",e);
		} catch (Exception e) {
			logger.error("Failed to get InitialContext",e);
		}
		return dataManager;
	}
	
	/**
	 * Get the User object for the currently authenticated user.
	 * 
	 * @return User current user.
	 */
	public User getLoggedInUser(){
		try {
			return getDataManager().getCurrentUser();
		} catch (ETSAccessException e) {
			return null; //NOTE: should be impossible.
		}
	}	
	
	/**
	 * Get all roles for the currently logged in user.
	 * 
	 * @return Set<Role> all roles for authenticated user.
	 */
	public Set<Role> getLoggedInUserRoles(){
		return getDataManager().getUserRoles(getLoggedInUser().getId());
	}

	@GET
	@Path("user/templates")
	@Produces(MediaType.APPLICATION_JSON)
	public UserTemplate[] getUserTemplates() {
		List<UserTemplate> utl = getDataManager().getUserTemplates();
		if(logger.isDebugEnabled())
			logger.debug("returning "+utl.size()+" user templates");
		return utl.toArray(new UserTemplate[utl.size()]);
	}
	
	/**
	 * Get an array of WatchList ids for the current user.
	 * 
	 * @return String[] watchlist ids.
	 * @throws DataManagementFault on error.
	 */
	@GET
	@Path("watchlist/ids")
	@Produces(MediaType.APPLICATION_JSON)
	public String[] getWatchListIds() throws DataManagementFault 
	{
		try {	
			List<String> wlidsl = getDataManager().getWatchListIds();
			String[] wlidsa = new String[wlidsl.size()];
			int i = 0;
			for(String s : wlidsl) {
				wlidsa[i++] = s;
			}
			return wlidsa;
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}
	
	/**
	 * Get a WatchList with the given id.
	 * 
	 * @param watchlistid int id of the watch list.
	 * @return WatchList the list with the given id.
	 * @throws DataManagementFault on error.
	 */
	@GET
	@Path("watchlist/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	public WatchList getWatchList(@PathParam("id") int watchlistid) throws DataManagementFault
	{
		try {
			return getDataManager().getWatchList(watchlistid);
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}

	/**
	 * Save a watch list.
	 * 
	 * @param watchList WatchList the list to save.
	 * @return int id of the saved list
	 * @throws DataManagementFault on error.
	 */
	@POST
	@Path("watchlist/add")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.TEXT_PLAIN)
	public int saveWatchList(WatchList watchList) throws DataManagementFault {
		User user = getLoggedInUser();
		// Sanity-check owner and company IDs
		if (watchList.getOwnerId() == 0) {
			watchList.setOwnerId(user.getId());
		}
		
		if (watchList.getCompanyId() == 0) {
			watchList.setCompanyId(user.getCompanyId());
		}
			
			
		try {
			return getDataManager().saveWatchList(watchList);
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return 0;
		}
	}
	
	/**
	 * Save some user templates.
	 * 
	 * @param templates UserTemplate[] user templates to save.
	 */
	@POST
	@Path("user/templates/save")
	@Consumes(MediaType.APPLICATION_JSON)
	public void saveUserTemplates(UserTemplate[] templates) {
		for(UserTemplate template : templates) {
			getDataManager().saveUserTemplate(template);
		}
	}
	
	/**
	 * Delete some user templates.
	 * 
	 * @param templates UserTemplate[] user templates to delete.
	 */
	@POST
	@Path("user/templates/delete")
	@Consumes(MediaType.APPLICATION_JSON)
	public void deleteUserTemplates(UserTemplate[] templates) {
		for(UserTemplate template : templates) {
			getDataManager().deleteUserTemplate(template);
		}
	}	
	
	/**
	 * Delete a watch list.
	 * 
	 * @param watchList WatchList the list to delete.
	 * @throws DataManagementFault on error.
	 */
	@POST
	@Path("watchlist/delete")
	@Consumes(MediaType.APPLICATION_JSON)
	public void deleteWatchList(WatchList watchList) throws DataManagementFault {
		try {
			getDataManager().deleteWatchList(watchList);
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
		}
	}	
	/**
	 * Send a user message to the OMS.
	 * 
	 * @param message Message to send.
	 * @return int id of new message object.
	 * @throws DataManagementFault on error.
	 */
	@POST
	@Path("messages")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.TEXT_PLAIN)
	public int sendMessage(Message message) throws DataManagementFault
	{
		try {
			message.setSender(getLoggedInUser().getId());
			return getDataManager().sendMessage(message);
		} catch (Exception e) {
			throw createDMF(e);
		}
	}
	
	/**
	 * Get user messages from OMS. This will return any existing undelivered messages.
	 * 
	 * @return Message[] all outstanding undelivered user messages.
	 * @throws DataManagementFault on error.
	 */
	@GET
	@Path("messages")
	@Produces(MediaType.APPLICATION_JSON)
	public Message[] getMessages() throws DataManagementFault {
		try {
			Set<Message> ms = getDataManager().getMessages(getLoggedInUser().getId());
			Message[] ma = new Message[ms.size()];
			int i = 0;
			for(Message m : ms) {
				ma[i++] = m;
			}
			return ma;
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}
	               
	/**
	 * Get the preferences object associated with the current user. If the user has no
	 * preferences stored then we will return an empty prefs object since SOAP WS-I profile
	 * will not let us return a null result.
	 * 
	 * @return Preferences the current user's preferences.
	 * @throws DataManagementFault on error.
	 */
	@GET
	@Path("preferences/user")
	@Produces(MediaType.APPLICATION_JSON)
	public Preferences getUserPreferences() throws DataManagementFault 
	{
		logger.debug("Entering getUserPrefereces()");
		try {
			
			logger.debug("Got past init() in getUserPreferences()");
			int uid = getLoggedInUser().getId();
			logger.debug("Getting user preferences for userid "+uid);
			Preferences prefs = getDataManager().getPreferences(uid);
			logger.debug("Got preferences of "+prefs);
			if(prefs == null) {
				prefs = new Preferences();
				prefs.setOwnerId(uid);
				prefs.setName("default");
				logger.debug("didn't find any preferences, creating some "+prefs);
			}
			return prefs;
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}
	
	/**
	 * Save the current user's preferences.
	 * 
	 * @param prefs Preferences the user's updated preferences.
	 * @return int id of user's Preferences object.
	 * @throws DataManagementFault on error.
	 */
	@POST
	@Path("preferences/user")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.TEXT_PLAIN)
	public int saveUserPreferences(Preferences prefs) throws DataManagementFault
	{
		try {
			
			Preferences p = null;
			try {
				p = getDataManager().getPreferences(prefs.getName());
			} catch (Exception e) {
				if(!(e.getCause() instanceof javax.persistence.NoResultException))
					throw e;
				p = new Preferences();
				p.setOwnerId(getLoggedInUser().getId());
				p.setName(prefs.getName());
			}
			prefs.setId(p.getId());
			p.setPreferences(prefs.getPreferences());
			int id = getDataManager().savePreferences(p);
			return id;
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return 0;
		}
	}
	
	/**
	 * Get information on a given company.
	 * 
	 * @param id int id of the company to get data for.
	 * @return Company company data.
	 * @throws DataManagementFault on error.
	 */
	@GET
	@Path("companies/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	public Company getCompany(@PathParam("id") int id) throws DataManagementFault
	{
		try {
			
			return getDataManager().getCompany(id);
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}
	
	/**
	 * Add or update information for a company. If the company object has an id of 0 a new company will be added to the
	 * ets database. If the id corresponds to an existing company the record will be updated.
	 * 
	 * @param ci Company the data to add or update.
	 * @return int id of the company object created/updated.
	 * @throws DataManagementFault on error.
	 */
	@POST
	@Path("companies")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.TEXT_PLAIN)
	public int saveCompany(Company ci) throws DataManagementFault
	{
		try {
			
			return getDataManager().saveCompany(ci).getId();
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return 0;
		}
	}
	
	/**
	 * Get information for a department.
	 * 
	 * @param id int id of the department.
	 * @return CompanyDivision data for the given department.
	 * @throws DataManagementFault on error.
	 */
	@GET
	@Path("companies/divisions/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	public CompanyDivision getDepartment(@PathParam("id") int id) throws DataManagementFault
	{
		try {
			return getDataManager().getDepartment(id);
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}
	
	/**
	 * Add or update a department. If the groupid of the department is 0 a new department will be added, otherwise the given
	 * department will be updated.
	 * 
	 * @param ci CompanyDivision the data to be added/updated.
	 * @return int id of the CompanyDivision object.
	 * @throws DataManagementFault on error.
	 */
	@POST
	@Path("companies/divisions")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.TEXT_PLAIN)
	public int saveDepartment(CompanyDivision ci) throws DataManagementFault
	{
		try {
			return getDataManager().saveDepartment(ci).getId();
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return 0;
		}
	}
	
	/**
	 * Get the profile data for a given user. Profile data consists of supplementary information for the given user
	 * (contact info, etc). This data is useful for business purposes but is not generally needed for trading.
	 * 
	 * @param userId int id of the user to get profile data for.
	 * @return Profile the profile data for the given user.
	 * @throws DataManagementFault on error.
	 */
	@GET
	@Path("users/{id}/profile")
	@Produces(MediaType.APPLICATION_JSON)
	public Profile getUserProfile(@PathParam("id") int userId ) throws DataManagementFault
	{
		try {
			return getDataManager().getProfile( userId );
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}
	
	/**
	 * Update the profile for a given user. All users have a profile and all profiles are linked to a user. The user id
	 * for the owner of the profile must exist.
	 * 
	 * @param up Profile the profile data to update.
	 * @return int id of the Profile object.
	 * @throws DataManagementFault on error.
	 */
	@POST
	@Path("users/profiles")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.TEXT_PLAIN)
	public int saveUserProfile(Profile up) throws DataManagementFault
	{
		try {
			
			return getDataManager().saveProfile(up);
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return 0;
		}
	}
	
	/**
	 * Get all role objects associated with the given user.
	 * 
	 * @param id int id of the user.
	 * @return Role[] all roles the given user has.
	 * @throws DataManagementFault on error.
	 */
	@GET
	@Path("users/{id}/permissions")
	@Produces(MediaType.APPLICATION_JSON)
	public Role[] getUserPermissions(@PathParam("id") int id) throws DataManagementFault
	{
		try {
			Set<Role> userRoles = getDataManager().getUserRoles(id);
			Role[] ura = new Role[userRoles.size()];
			int index = 0;
			for(Role r : userRoles) {
				ura[index++] = r;
			}
			return ura;
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}

	/**
	 * Associate a group of role ids with the given user id.
	 * 
	 * @param id int id of user to associate roles with.
	 * @param roleids Integer[] ids of the roles to associate.
	 * @throws DataManagementFault on error.
	 */
	@POST
	@Path("users/{id}/permissions")
	@Consumes(MediaType.APPLICATION_JSON)
	public void setUserPermissions(@PathParam("id") int id, Integer[] roleids) throws DataManagementFault
	{
		try {
			User u = getDataManager().getUser(id);
			Set<Role> allRoles = getDataManager().getRoles();
			List<Role> userRoles = new ArrayList<Role>();
			for(Integer rid : roleids) {
				Role tr = new Role();
				tr.setId(rid);
				userRoles.add(tr);
			}
			allRoles.retainAll(userRoles);
			getDataManager().updateUser(u, allRoles);
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
		}
	}
	
	/**
	 * Update or create a user. The user object, profile, and roles the user should be associated with will be added to the
	 * ets database or updated.
	 * 
	 * @param ui User user object for the new/updated user.
	 * @param up Profile extended user information to update/add.
	 * @param roleids Integer[] list of roles the user should be associated with.
	 * @return int id of the User.
	 * @throws DataManagementFault on error.
	 */
	@POST
	@Path("users/full")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.TEXT_PLAIN)
	public int saveFullUser(User ui, Profile up, Integer[] roleids) throws DataManagementFault
	{
		try {
			
			Set<Role> allRoles = null;
			if(roleids != null) 
			{
				allRoles = getDataManager().getRoles();
				List<Role> userRoles = new ArrayList<Role>();
				for(Integer rid : roleids) {
					Role tr = new Role();
					tr.setId(rid);
					userRoles.add(tr);
				}
				allRoles.retainAll(userRoles);
			}
			return getDataManager().saveFullUser(ui,up,allRoles).getId();
//			dm.saveUser(u);
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return 0;
		}
	}
	
	@POST
	@Path("users/userinfo")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.TEXT_PLAIN)
	public int saveUserInfo(UserInfo ui) throws DataManagementFault {
		Integer[] rid = null;
		if (ui.getRoles() != null) {
			rid = new Integer[ui.getRoles().size()];
			int i = 0;
			for(Role r : ui.getRoles()) {
				rid[i++] = r.getId();
			}
		}
		return saveFullUser(ui.getUser(), ui.getProfile(), rid);
	}
	
	/**
	 * Get a user with the given id.
	 * 
	 * @param id long id of user
	 * @return UserInfo info for the user
	 * @throws DataManagementFault if access is forbidden
	 */
	@GET
	@Path("users/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	public User getUser(@PathParam("id") int id) throws DataManagementFault
	{
		try {
			return getDataManager().getUser(id);
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}
	
	/**
	 * Create or update a user. Note that this shouldn't be used to create new users since no profile information or roles
	 * will be associated with the user. It is more efficient than saveFullUser() if profile and role information is not
	 * being changed.
	 * 
	 * @param ui User user to create or update.
	 * @return long id of user.
	 * @throws DataManagementFault on error.
	 */
	@POST
	@Path("users")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.TEXT_PLAIN)
	public int saveUser(User ui) throws DataManagementFault
	{
		try {
			return getDataManager().updateUser(ui,null);
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return 0;
		}
	}

	/**
	 * Get user info for the currently authenticated user.
	 * 
	 * @return User authenticated user 
	 */
	@GET
	@Path("users/current")
	@Produces(MediaType.APPLICATION_JSON)
	public User getCurrentUser() throws DataManagementFault
	{
		try {
			return getLoggedInUser();
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}
	
	/**
	 * Get the department of the currently authenticated user.
	 * 
	 * @return CompanyDivision current user's department.
	 */
	@GET
	@Path("/users/current/companies/divisions")
	@Produces(MediaType.APPLICATION_JSON)
	public CompanyDivision getCurrentDepartment() throws DataManagementFault
	{
		try {
			
			return getDataManager().getCurrentDepartment();
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}
	
	@GET
	@Path("companies/{id}/users/live") 
	@Produces(MediaType.APPLICATION_JSON)
	public User[] getLiveTopLevelUsers(@PathParam("id") int id) throws DataManagementFault {
		return getTopLevelUsers(id, false);
	}
	
	@GET
	@Path("companies/{id}/users/all") 
	@Produces(MediaType.APPLICATION_JSON)
	public User[] getAllTopLevelUsers(@PathParam("id") int id) throws DataManagementFault {
		return getTopLevelUsers(id, true);
	}
	
	@GET
	@Path("users/all")
	@Produces(MediaType.APPLICATION_JSON)
	public List<UserInfo> getAllVisibleUsers() throws DataManagementFault {
		String prole = getPrimaryRole();
		if ("administrator".equals(prole)) {
			return getDataManager().findUsers(new UserFilter());
		} else if ("companyadmin".equals(prole)){
			UserFilter f = new UserFilter();
			f.setCompanyid(getCurrentUser().getCompanyId());
			return getDataManager().findUsers(f);
		} else if ("admin".equals(prole)) {
			UserFilter f = new UserFilter();
			f.setDepartmentid(getCurrentUser().getGroupId());
			return getDataManager().findUsers(f);			
		} else {
			UserFilter f = new UserFilter();
			f.setUsername(getCurrentUser().getUserName());
			return getDataManager().findUsers(f);			
		}
	}
	
	/**
	 * Get the top level (Company) users for a given company. If showDeleted is true then
	 * records market deleted will be returned, otherwise they will not.
	 * 
	 * @param id long id of company.
	 * @param showDeleted boolean if true deleted records will be returned.
	 * @return User[] of user descriptions.
	 * @throws DataManagementFault if access is forbidden
	 */
	public User[] getTopLevelUsers(int id,boolean showDeleted) throws DataManagementFault
	{
		try {			
			Set<User> cus = getDataManager().getTopLevelUsers(id);
			if(!showDeleted) {
				Iterator<User> ci = cus.iterator();
				while(ci.hasNext()) {
					User c = ci.next();
					if(c.getState() == AccessibleState.DELETED)
						ci.remove();
				}
			}
			User[] uia = new User[cus.size()];
			int index = 0;
			for(User u : cus) {
				uia[index++] = u;
			}
			return uia;
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}

	/**
	 * Show all users visible to the logged-in user from the indicated company.
	 * @param id companyid
	 * @return User[] visible users
	 * @throws DataManagementFault
	 */
	// TODO: re-enable this when we're routing calls through OperationsBean --NS
/*	@GET
	@Path("companies/{id}/users/visible") 
	@Produces(MediaType.APPLICATION_JSON)
	public User[] getAllVisibleUsers(@PathParam("id") int id) throws DataManagementFault {
		try {
			init();
			Set<User> visUsers = operationsBean.getAllVisibleUsers(id);
			return (User[]) visUsers.toArray();
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	} */	
	
	/**
	 * Get the name of the most permissive trading role the current user has. This is useful when a client application wants
	 * to present role-specific options.
	 * 
	 * @return String name of most permissive role for this user.
	 */
	@GET
	@Path("users/current/permissions/primary") 
	@Produces(MediaType.TEXT_PLAIN)
	public String getPrimaryRole() throws DataManagementFault
	{
		try {
			String prole = "";
			Set<Role> rs = getLoggedInUserRoles();
			for(Role r : rs) {
				if(r.getRoleName().equals("administrator"))
					return "administrator";
				else if(r.getRoleName().equals("companyadmin"))
					prole = "companyadmin";
				else if(r.getRoleName().equals("admin") && !prole.equals("companyadmin"))
					prole = "admin";
				else if(r.getRoleName().equals("trader") && !prole.equals("companyadmin") && !prole.equals("admin"))
					prole = "trader";
			}
			return prole;
		} catch (Exception e) {
			throw createDMF(e);
		}
	}
	
	@GET
	@Path("roles/defaults/{id}/department")
	@Produces(MediaType.APPLICATION_JSON)
	public Role[] getDefaultRoles(@PathParam("id") int department) {
		return getDataManager().getDefaultPermissions(department);
	}
	
	/**
	 * Get all roles defined on this system. This will return an array of Role objects contained in the ets database.
	 * 
	 * @return Role[] an array of all available roles.
	 * @throws DataManagementFault on error.
	 */
	@GET
	@Path("roles/all")
	@Produces(MediaType.APPLICATION_JSON)
	public Role[] getAllRoles() throws DataManagementFault {
		try {
			
			Set<Role> roles =  getDataManager().getRoles();
			Role[] ra = new Role[roles.size()];
			int index = 0;
			for(Role r : roles) {
				ra[index++] = r;
			}
			return ra;
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}
	
	/**
	 * Add or update a Role
	 * @param roleID int ID of role - 0 for new.
	 * @param roleName String name of role.
	 * @param roleCategory String name of role category.
	 * @throws RemoteException
	 */
	@POST
	@Path("roles/save")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void saveRole(int roleID, String roleName, String roleCategory) throws DataManagementFault {	
		if (!Util.hasRoleGroup("Role", "administrator")) {
			logger.debug("Insufficient permissions to save role.");
			return;
		}
		try {
			getDataManager().saveRole(new Role(roleID, roleName, roleCategory));
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;		
		}
	}
	
	/**
	 * Delete a Role
	 * @param roleID int ID of role to delete.
	 * @throws RemoteException
	 */
	@POST
	@Path("roles/delete")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void deleteRole(int roleID) throws DataManagementFault {	
		if (!Util.hasRoleGroup("Role", "administrator")) {
			logger.debug("Insufficient permissions to add delete role.");
			return;
		}
		try {
			getDataManager().deleteRole(roleID);
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;		
		}
	}
	
	/**
	 * Update set of roles for user.
	 * @param roleID int ID of user to update
	 * @param roles <Set>
	 * @throws RemoteException
	 */
	@POST
	@Path("roles/user/save")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void saveUserRoles(int userID, Role[] roles) throws DataManagementFault {
		// TODO: this needs to be improved.
		if (!Util.hasRoleGroup("Role", "administrator") && !Util.hasRoleGroup("Role", "companyadmin")
				&& !Util.hasRoleGroup("Role", "admin")) {
			logger.debug("Insufficient permissions to update user roles.");
			return;
		}
		try {
			Set<Role> roleSet = new HashSet<Role>(Arrays.asList(roles));
			getDataManager().setUserRoles(userID, roleSet);
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;		
		}
	}	
	
	/**
	 * Get all roles assigned to the specified user.
	 * 
	 * @param userid int user ID
	 * @return Role[] an array of roles assigned to the user
	 * @throws DataManagementFault on error.
	 */
	@GET
	@Path("roles/user/{id}/all")
	@Produces(MediaType.APPLICATION_JSON)
	public Role[] getUserRoles(@PathParam("id") int userid) throws DataManagementFault {
		try {
			
			Set<Role> roles =  getDataManager().getUserRoles(userid);
			Role[] ra = new Role[roles.size()];
			int index = 0;
			for(Role r : roles) {
				ra[index++] = r;
			}
			return ra;
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}	
	
	@GET
	@Path("users/current/companies/live")
	@Produces(MediaType.APPLICATION_JSON)
	public Company[] getAllLiveCompanies() throws DataManagementFault {
		return getAllCompanies(false);
	}
	
	@GET
	@Path("users/current/companies/all")
	@Produces(MediaType.APPLICATION_JSON)
	public Company[] getAllCompanies() throws DataManagementFault {
		return getAllCompanies(true);
	}
	
	/**
	 * Get all companies visible to the current user.
	 * 
	 * @param showDeleted boolean if true show deleted records.
	 * 
	 * @return CompanyInfo[] all visible companies
	 */
	public Company[] getAllCompanies(boolean showDeleted) throws DataManagementFault
	{
		try {
			init();
			Collection<Company> cs = new HashSet<Company>();
			if ("administrator".equals(getPrimaryRole())) {
				cs.addAll(getDataManager().getAllCompanies());
			} else {
				cs.add(getDataManager().getCurrentCompany());
			}
			if(!showDeleted) {
				Iterator<Company> ci = cs.iterator();
				while(ci.hasNext()) {
					Company c = ci.next();
					if(c.getState() == AccessibleState.DELETED)
						ci.remove();
				}
			}
			Company[] cia = new Company[cs.size()];
			int index = 0;
			for(Company c : cs) {
				cia[index++] = c;
			}
			return cia;
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}
	
	@GET
	@Path("users/current/companies/{id}/departments/live")
	@Produces(MediaType.APPLICATION_JSON)
	public CompanyDivision[] getLiveCompanyDepartments(@PathParam("id") int id) throws DataManagementFault {
		return getCompanyDepartments(id, false);
	}
	
	@GET
	@Path("users/current/companies/{id}/departments/all")
	@Produces(MediaType.APPLICATION_JSON)
	public CompanyDivision[] getAllCompanyDepartments(@PathParam("id") int id) throws DataManagementFault {
		return getCompanyDepartments(id, true);
	}
	
	@GET
	@Path("users/current/companies/departments/all")
	@Produces(MediaType.APPLICATION_JSON)
	public Set<CompanyDivision> getAllVisibleDepartments() throws DataManagementFault {
		if ("administrator".equals(getPrimaryRole())) {
			return getDataManager().getAllDepartments();
		} else if ("companyadmin".equals(getPrimaryRole())) {
			Set<CompanyDivision> depts = new HashSet<CompanyDivision>();
			Collections.addAll(depts, getLiveCompanyDepartments(getCurrentUser().getGroupId()));
			return depts;
		} else {
			Set<CompanyDivision> depts = new HashSet<CompanyDivision>();
			depts.add(getCurrentDepartment());
			return depts;
		}
	}	

	/**
	 * Get all departments visible to the current user in the given company.
	 * 
	 * @param id long id of company
	 * @param showDeleted boolean if true show deleted records
	 * 
	 * @return DepartmentInfo[] all visible departments
	 * @throws DataManagementFault if user is denied access to the given company entirely
	 */
	public CompanyDivision[] getCompanyDepartments(int id,boolean showDeleted) throws DataManagementFault
	{
		try {	
			Set<CompanyDivision> cds = getDataManager().getCompanyDepartments(id);
			if(!showDeleted) {
				Iterator<CompanyDivision> ci = cds.iterator();
				while(ci.hasNext()) {
					CompanyDivision c = ci.next();
					if(c.getState() == AccessibleState.DELETED)
						ci.remove();
				}
			}
			CompanyDivision[] dia = new CompanyDivision[cds.size()];
			int index = 0;
			for(CompanyDivision cd : cds) {
					dia[index++] = cd;
			}
			return dia;
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}

	
	@GET
	@Path("users/current/companies/departments/{id}/users/live")
	@Produces(MediaType.APPLICATION_JSON)
	public User[] getLiveDepartmentUsers(@PathParam("id") int id) throws DataManagementFault {
		return getDepartmentUsers(id, false);
	}
	
	@GET
	@Path("users/current/companies/departments/{id}/users/all")
	@Produces(MediaType.APPLICATION_JSON)
	public User[] getAllDepartmentUsers(@PathParam("id") int id) throws DataManagementFault {
		return getDepartmentUsers(id, true);
	}
	
	@GET
	@Path("users/current/companies/departments/{id}/userinfo/all")
	@Produces(MediaType.APPLICATION_JSON)
	public UserInfo[] getAllDepartmentUserInfo(@PathParam("id") int id) throws DataManagementFault {
		return getDepartmentUserInfo(id, true);
	}
	
	/**
	 * Get all users visible to the current user in the given department.
	 * 
	 * @param id long id of department
	 * @param showDeleted boolean if true show deleted records
	 * 
	 * @return UserInfo[] all visible users
	 */
	public UserInfo[] getDepartmentUserInfo(int id, boolean showDeleted) throws DataManagementFault
	{
		try {
			
			List<UserInfo> us = getDataManager().getDepartmentUserInfo(id);
			if(!showDeleted) {
				Iterator<UserInfo> ci = us.iterator();
				while(ci.hasNext()) {
					UserInfo c = ci.next();
					if(c.getState() == AccessibleState.DELETED.ordinal())
						ci.remove();
				}
			}
			UserInfo[] uia = new UserInfo[us.size()];
			int index = 0;
			for(UserInfo u : us) {
				uia[index++] = u;
			}
			return uia;
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}
	
	/**
	 * Get all users visible to the current user in the given department.
	 * 
	 * @param id long id of department
	 * @param showDeleted boolean if true show deleted records
	 * 
	 * @return UserInfo[] all visible users
	 */
	public User[] getDepartmentUsers(int id, boolean showDeleted) throws DataManagementFault
	{
		try {
			
			Set<User> us = getDataManager().getDepartmentUsers(id);
			if(!showDeleted) {
				Iterator<User> ci = us.iterator();
				while(ci.hasNext()) {
					User c = ci.next();
					if(c.getState() == AccessibleState.DELETED)
						ci.remove();
				}
			}
			User[] uia = new User[us.size()];
			int index = 0;
			for(User u : us) {
				uia[index++] = u;
			}
			return uia;
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}

	@GET
	@Path("users/current/companies/{id}/departments/subdepartments/live")
	@Produces(MediaType.APPLICATION_JSON)
	public CompanyDivision[] getLiveSubDepartments(@PathParam("id") int id) throws DataManagementFault {
		return getSubDepartments(id, false);
	}
	
	@GET
	@Path("users/current/companies/{id}/departments/subdepartments/all")
	@Produces(MediaType.APPLICATION_JSON)
	public CompanyDivision[] getAllSubDepartments(@PathParam("id") int id) throws DataManagementFault {
		return getSubDepartments(id, true);
	}	
	
	/**
	 * Get all subdepartments of the given department visible to the user
	 * 
	 * @param id long id of parent department
	 * @param showDeleted boolean if true show deleted records
	 * 
	 * @return DepartmentInfo[] all visible departments
	 */
	public CompanyDivision[] getSubDepartments(int id, boolean showDeleted) throws DataManagementFault
	{
		try {
			
			Set<CompanyDivision> cds = getDataManager().getSubDepartments(id);		
			if(!showDeleted) {
				Iterator<CompanyDivision> ci = cds.iterator();
				while(ci.hasNext()) {
					CompanyDivision c = ci.next();
					if(c.getState() == AccessibleState.DELETED)
						ci.remove();
				}
			}
			CompanyDivision[] dia = new CompanyDivision[cds.size()];
			int index = 0;
			for(CompanyDivision cd : cds) {
				dia[index++] = cd;
			}
			return dia;
		} catch (Exception e) {
			DataManagementFault dmf = createDMF(e);
			if(dmf != null) throw dmf;
			return null;
		}
	}

	@Override
	public Response toResponse(DataManagementFault fault) {
		return Response.status(500).entity(new String(fault.getErrorCode()+":"+fault.getMessage())).build();
	}
	
	@POST
	@Path("companies/purge")
	@Produces(MediaType.APPLICATION_JSON)
	public void purgeDeletedRecords() {
		getDataManager().clearAllDeletedRecords();
	}
	
	@POST
	@Path("companies/departments/purge")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void purgeDeletedDepartmentRecords(int company) {
		getDataManager().clearDeletedDepartmentsFromCompany(company);
	}
	
	@POST
	@Path("companies/users/purge")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void purgeDeletedUserRecords(int company) {
		getDataManager().clearDeletedUsersFromCompany(company);
	}
}
