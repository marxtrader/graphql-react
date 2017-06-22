package com.tradedesksoftwar.etsweb.rest;

import java.rmi.RemoteException;
import java.util.List;
import java.util.Set;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.ext.Provider;

import com.tradedesksoftware.etsdata.messages.Message;
import com.tradedesksoftware.etsdata.stock.WatchList;
import com.tradedesksoftware.etsdata.users.Preferences;
import com.tradedesksoftware.etsdata.users.Profile;
import com.tradedesksoftware.etsdata.users.Role;
import com.tradedesksoftware.etsdata.users.User;
import com.tradedesksoftware.etsdata.users.UserInfo;
import com.tradedesksoftware.etsdata.users.UserTemplate;
import com.tradedesksoftware.etsdata.users.group.Company;
import com.tradedesksoftware.etsdata.users.group.CompanyDivision;
import com.tradedesksoftware.etsweb.soap.fault.DataManagementFault;

@Path("rest")
@Provider // Exception mapper provider
@Consumes(MediaType.TEXT_PLAIN)
@Produces(MediaType.TEXT_PLAIN)
public interface IDataManagementRESTServices {

	public enum ErrorCodes {
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
	
	@POST
	@Path("application/save")
	@Produces(MediaType.TEXT_PLAIN)
	@Consumes(MediaType.APPLICATION_JSON)
	public int saveApplication(com.tradedesksoftware.etsdata.users.Application app) throws DataManagementFault;
	
	/**
	 * Get the User object for the currently authenticated user.
	 * 
	 * @return User current user.
	 */
	@GET
	@Path("user/loggedin")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract User getLoggedInUser();

	/**
	 * Get all roles for the currently logged in user.
	 * 
	 * @return Set<Role> all roles for authenticated user.
	 */
	@GET
	@Path("user/loggedin/roles")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract Set<Role> getLoggedInUserRoles();

	@GET
	@Path("user/templates")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract UserTemplate[] getUserTemplates();

	/**
	 * Get an array of WatchList ids for the current user.
	 * 
	 * @return String[] watchlist ids.
	 * @throws DataManagementFault on error.
	 */
	@GET
	@Path("watchlist/ids")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract String[] getWatchListIds() throws DataManagementFault;

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
	public abstract WatchList getWatchList(@PathParam("id") int watchlistid)
			throws DataManagementFault;

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
	public abstract int saveWatchList(WatchList watchList)
			throws DataManagementFault;

	/**
	 * Save some user templates.
	 * 
	 * @param templates UserTemplate[] user templates to save.
	 */
	@POST
	@Path("user/templates/save")
	@Consumes(MediaType.APPLICATION_JSON)
	public abstract void saveUserTemplates(UserTemplate[] templates);

	/**
	 * Delete some user templates.
	 * 
	 * @param templates UserTemplate[] user templates to delete.
	 */
	@POST
	@Path("user/templates/delete")
	@Consumes(MediaType.APPLICATION_JSON)
	public abstract void deleteUserTemplates(UserTemplate[] templates);

	/**
	 * Delete a watch list.
	 * 
	 * @param watchList WatchList the list to delete.
	 * @throws DataManagementFault on error.
	 */
	@POST
	@Path("watchlist/delete")
	@Consumes(MediaType.APPLICATION_JSON)
	public abstract void deleteWatchList(WatchList watchList)
			throws DataManagementFault;

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
	public abstract int sendMessage(Message message) throws DataManagementFault;

	/**
	 * Get user messages from OMS. This will return any existing undelivered messages.
	 * 
	 * @return Message[] all outstanding undelivered user messages.
	 * @throws DataManagementFault on error.
	 */
	@GET
	@Path("messages")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract Message[] getMessages() throws DataManagementFault;

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
	public abstract Preferences getUserPreferences() throws DataManagementFault;

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
	public abstract int saveUserPreferences(Preferences prefs)
			throws DataManagementFault;

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
	public abstract Company getCompany(@PathParam("id") int id) throws DataManagementFault;

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
	public abstract int saveCompany(Company ci) throws DataManagementFault;

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
	public abstract CompanyDivision getDepartment(@PathParam("id") int id)
			throws DataManagementFault;

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
	public abstract int saveDepartment(CompanyDivision ci)
			throws DataManagementFault;

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
	public abstract Profile getUserProfile(@PathParam("id") int userId)
			throws DataManagementFault;

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
	public abstract int saveUserProfile(Profile up) throws DataManagementFault;

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
	public abstract Role[] getUserPermissions(@PathParam("id") int id)
			throws DataManagementFault;

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
	public abstract void setUserPermissions(@PathParam("id") int id, Integer[] roleids)
			throws DataManagementFault;

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
	public abstract int saveFullUser(User ui, Profile up, Integer[] roleids)
			throws DataManagementFault;

	@POST
	@Path("users/userinfo")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.TEXT_PLAIN)
	public abstract int saveUserInfo(UserInfo ui) throws DataManagementFault;

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
	public abstract User getUser(@PathParam("id") int id) throws DataManagementFault;

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
	public abstract int saveUser(User ui) throws DataManagementFault;

	/**
	 * Get user info for the currently authenticated user.
	 * 
	 * @return User authenticated user 
	 */
	@GET
	@Path("users/current")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract User getCurrentUser() throws DataManagementFault;

	/**
	 * Get the department of the currently authenticated user.
	 * 
	 * @return CompanyDivision current user's department.
	 */
	@GET
	@Path("/users/current/companies/divisions")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract CompanyDivision getCurrentDepartment()
			throws DataManagementFault;

	@GET
	@Path("companies/{id}/users/live") 
	@Produces(MediaType.APPLICATION_JSON)
	public abstract User[] getLiveTopLevelUsers(@PathParam("id") int id)
			throws DataManagementFault;

	@GET
	@Path("companies/{id}/users/all") 
	@Produces(MediaType.APPLICATION_JSON)
	public abstract User[] getAllTopLevelUsers(@PathParam("id") int id)
			throws DataManagementFault;

	@GET
	@Path("users/all")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract List<UserInfo> getAllVisibleUsers()
			throws DataManagementFault;

	/**
	 * Get the top level (Company) users for a given company. If showDeleted is true then
	 * records market deleted will be returned, otherwise they will not.
	 * 
	 * @param id long id of company.
	 * @param showDeleted boolean if true deleted records will be returned.
	 * @return User[] of user descriptions.
	 * @throws DataManagementFault if access is forbidden
	 */
	@GET
	@Path("company/{id}/users/toplevel/{showDeleted}")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract User[] getTopLevelUsers(@PathParam("id") int id,@PathParam("showDeleted")  boolean showDeleted)
			throws DataManagementFault;

	/**
	 * Get the name of the most permissive trading role the current user has. This is useful when a client application wants
	 * to present role-specific options.
	 * 
	 * @return String name of most permissive role for this user.
	 */
	@GET
	@Path("users/current/permissions/primary") 
	@Produces(MediaType.TEXT_PLAIN)
	public abstract String getPrimaryRole() throws DataManagementFault;

	@GET
	@Path("roles/defaults/{id}/department")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract Role[] getDefaultRoles(@PathParam("id") int department);

	/**
	 * Get all roles defined on this system. This will return an array of Role objects contained in the ets database.
	 * 
	 * @return Role[] an array of all available roles.
	 * @throws DataManagementFault on error.
	 */
	@GET
	@Path("roles/all")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract Role[] getAllRoles() throws DataManagementFault;

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
	public abstract void saveRole(int roleID, String roleName,
			String roleCategory) throws DataManagementFault;

	/**
	 * Delete a Role
	 * @param roleID int ID of role to delete.
	 * @throws RemoteException
	 */
	@POST
	@Path("roles/delete")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public abstract void deleteRole(int roleID) throws DataManagementFault;

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
	public abstract void saveUserRoles(int userID, Role[] roles)
			throws DataManagementFault;

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
	public abstract Role[] getUserRoles(@PathParam("id") int userid) throws DataManagementFault;

	@GET
	@Path("users/current/companies/live")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract Company[] getAllLiveCompanies() throws DataManagementFault;

	@GET
	@Path("users/current/companies/all")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract Company[] getAllCompanies() throws DataManagementFault;

	/**
	 * Get all companies visible to the current user.
	 * 
	 * @param showDeleted boolean if true show deleted records.
	 * 
	 * @return CompanyInfo[] all visible companies
	 */
	@GET
	@Path("users/current/companies/visible/{showDeleted}")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract Company[] getAllCompanies(@PathParam("showDeleted") boolean showDeleted)
			throws DataManagementFault;

	@GET
	@Path("users/current/companies/{id}/departments/live")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract CompanyDivision[] getLiveCompanyDepartments(@PathParam("id") int id)
			throws DataManagementFault;

	@GET
	@Path("users/current/companies/{id}/departments/all")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract CompanyDivision[] getAllCompanyDepartments(@PathParam("id") int id)
			throws DataManagementFault;

	@GET
	@Path("users/current/companies/departments/all")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract Set<CompanyDivision> getAllVisibleDepartments()
			throws DataManagementFault;

	/**
	 * Get all departments visible to the current user in the given company.
	 * 
	 * @param id long id of company
	 * @param showDeleted boolean if true show deleted records
	 * 
	 * @return DepartmentInfo[] all visible departments
	 * @throws DataManagementFault if user is denied access to the given company entirely
	 */
	@GET
	@Path("users/current/companies/{id}/departments/visible/{showDeleted}")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract CompanyDivision[] getCompanyDepartments(@PathParam("id")int id,
			@PathParam("showDeleted") boolean showDeleted) throws DataManagementFault;

	@GET
	@Path("users/current/companies/departments/{id}/users/live")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract User[] getLiveDepartmentUsers(@PathParam("id") int id)
			throws DataManagementFault;

	@GET
	@Path("users/current/companies/departments/{id}/users/all")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract User[] getAllDepartmentUsers(@PathParam("id") int id)
			throws DataManagementFault;

	@GET
	@Path("users/current/companies/departments/{id}/userinfo/all")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract UserInfo[] getAllDepartmentUserInfo(@PathParam("id") int id)
			throws DataManagementFault;

	/**
	 * Get all users visible to the current user in the given department.
	 * 
	 * @param id long id of department
	 * @param showDeleted boolean if true show deleted records
	 * 
	 * @return UserInfo[] all visible users
	 */
	@GET
	@Path("users/current/companies/departments/{id}/userinfo/visible/{showDeleted}")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract UserInfo[] getDepartmentUserInfo(@PathParam("id") int id,@PathParam("showDeleted")  boolean showDeleted)
			throws DataManagementFault;

	/**
	 * Get all users visible to the current user in the given department.
	 * 
	 * @param id long id of department
	 * @param showDeleted boolean if true show deleted records
	 * 
	 * @return UserInfo[] all visible users
	 */
	@GET
	@Path("users/current/companies/departments/{id}/user/visible/{showDeleted}")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract User[] getDepartmentUsers(@PathParam("id") int id,@PathParam("showDeleted") boolean showDeleted)
			throws DataManagementFault;

	@GET
	@Path("users/current/companies/{id}/departments/subdepartments/live")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract CompanyDivision[] getLiveSubDepartments(@PathParam("id") int id)
			throws DataManagementFault;

	@GET
	@Path("users/current/companies/{id}/departments/subdepartments/all")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract CompanyDivision[] getAllSubDepartments(@PathParam("id") int id)
			throws DataManagementFault;

	/**
	 * Get all subdepartments of the given department visible to the user
	 * 
	 * @param id long id of parent department
	 * @param showDeleted boolean if true show deleted records
	 * 
	 * @return DepartmentInfo[] all visible departments
	 */
	@GET
	@Path("users/current/companies/{id}/departments/subdepartments/visible/{showDeleted}")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract CompanyDivision[] getSubDepartments(@PathParam("id") int id,
			@PathParam("showDeleted") boolean showDeleted) throws DataManagementFault;

	@POST
	@Path("companies/purge")
	@Produces(MediaType.APPLICATION_JSON)
	public abstract void purgeDeletedRecords();

	@POST
	@Path("companies/departments/purge")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public abstract void purgeDeletedDepartmentRecords(int company);

	@POST
	@Path("companies/users/purge")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public abstract void purgeDeletedUserRecords(int company);

}