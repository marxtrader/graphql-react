package com.tradedesksoftware.ets.omsweb;

/*
 * Created on Nov 25, 2015
 *
 * This code is the proprietary confidential property of TradeDesk
 * Software Inc and may not be redistributed or used for any other
 * purpose without the express consent of TradeDesk Software Inc.
 * 
 * Copyright 2015 TradeDesk Software Inc. All Rights Reserved
 */

import java.math.BigDecimal;
import java.rmi.RemoteException;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import javax.management.InstanceNotFoundException;
import javax.management.MBeanException;
import javax.management.MalformedObjectNameException;
import javax.management.ReflectionException;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.ext.Provider;

import com.tradedesksoftware.ets.TradingReport.BookType;
import com.tradedesksoftware.ets.TradingReport.BookTypeFilter;
import com.tradedesksoftware.ets.TradingReport.DashboardInfo;
import com.tradedesksoftware.ets.TradingReport.GreyLabel;
import com.tradedesksoftware.ets.core.definitions.AccountTypes;
import com.tradedesksoftware.ets.core.definitions.ExecutionInstructions;
import com.tradedesksoftware.ets.core.definitions.ExecutionTypes;
import com.tradedesksoftware.ets.core.definitions.InstrumentTypes;
import com.tradedesksoftware.ets.core.definitions.OrderStatuses;
import com.tradedesksoftware.ets.core.definitions.OrderTypes;
import com.tradedesksoftware.ets.core.definitions.Sides;
import com.tradedesksoftware.ets.core.definitions.TicketStatuses;
import com.tradedesksoftware.ets.core.definitions.TimesInForce;
import com.tradedesksoftware.ets.core.entities.Account;
import com.tradedesksoftware.ets.core.entities.Credentials;
import com.tradedesksoftware.ets.core.entities.Destination;
import com.tradedesksoftware.ets.core.entities.Exchange;
import com.tradedesksoftware.ets.core.entities.Execution;
import com.tradedesksoftware.ets.core.entities.LogEntry;
import com.tradedesksoftware.ets.core.entities.Order;
import com.tradedesksoftware.ets.core.entities.Position;
import com.tradedesksoftware.ets.core.entities.PositionAdjustment;
import com.tradedesksoftware.ets.core.exceptions.ETSAccessException;
import com.tradedesksoftware.ets.events.ETSEventMessage;
import com.tradedesksoftware.ets.omsweb.Faults.OMSOrderServiceFault;
import com.tradedesksoftware.ets.orderdb.AccountFilter;
import com.tradedesksoftware.ets.orderdb.DestinationInfo;
import com.tradedesksoftware.ets.orderdb.OrderDBException;
import com.tradedesksoftware.ets.sequencemanager.SequenceAllocation;
import com.tradedesksoftware.ets.sequencemanager.SequenceSource;
import com.tradedesksoftware.etsdata.users.exceptions.UserManagementException;
import com.tradedesksoftware.feedhandler.core.MarketData;
import com.tradedesksoftware.marketdata.exceptions.MarketDataException;
import com.tradedesksoftware.systemeventnotifier.ISystemEvent;

/**
 * JAX-RS web service API interface. Used to build RESTEasy service bean and client.
 */

/* 
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
@Consumes(MediaType.TEXT_PLAIN)
@Produces(MediaType.TEXT_PLAIN)
public interface IOMSOrderManagementRESTServices {

	public final static String COMMUNICATIONS = "COMMUNICATIONS";
	public final static String PERMISSIONS = "PERMISSIONS";
	public final static String GENERAL = "GENERAL";

	/**
	 * Get the default hold time for a named DelayedBBookGenerator module. 
	 * 
	 * @param modulename Name of the BBook generator module.
	 * @return Module delay time in milliseconds.
	 * @throws RemoteException if no such module exists or a service error occurs.
	 */
	@GET
	@Path("delayedbbookgenerator/{modulename}/defaultholdtime")
	@Produces(MediaType.TEXT_PLAIN)
	public int getDelayedBBookGeneratorDefaultHoldTime(@PathParam("modulename") String modulename) throws RemoteException;
	
	/**
	 * <p>
	 * Generate a synthetic market data tick and inject it into the OMS. Note that the OMS must be properly configured with routes capable
	 * of accepting updates. The data will be presented to the OMS on the given route via the market data service in the same fashion as data
	 * originating from any other route.
	 * </p>
	 * <p>
	 * <em>NOTE:</em> this is NOT a way to provide market data to the platform generally, as other external market data clients aren't provided data via
	 * the OMS, but directly from a feed handler. This facility is useful for performing certain types of controlled testing of OMS and client order handling
	 * logic.
	 * </p>
	 * 
	 * @param modulename Name of the feed module this tick is being sent to.
	 * @param tick MarketData object containing the data.
	 * @throws RemoteException thrown on service failure.
	 * @throws MarketDataException thrown if the route for the tick is invalid or the module doesn't exist.
	 */
	@POST
	@Path("marketdata/send/{modulename}")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void sendTick(@PathParam("modulename") String modulename, MarketData tick) throws RemoteException, MarketDataException;
	
	/**
	 * Set configuration properties of a MergedMarketRouter module.
	 * 
	 * @param modulename Name of the MergedMarketRouter module to update configuration for.
	 * @param settings Properties object containing the new settings.
	 * 
	 * @throws MalformedObjectNameException thrown if module name is invalid.
	 * @throws InstanceNotFoundException thrown if module cannot be found.
	 * @throws NullPointerException thrown if update causes an NPE (not sure if this is possible).
	 * @throws ReflectionException thrown if module is of incorrect type or doesn't support this operation.
	 * @throws MBeanException thrown if JMX reports an error on invocation.
	 * @throws RemoteException thrown if service fails.
	 */
	@POST
	@Path("mergedmarketrouter/{modulename}")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void setSettings(@PathParam("modulename") String modulename, Properties settings) throws MalformedObjectNameException, InstanceNotFoundException, NullPointerException, ReflectionException, MBeanException, RemoteException;
	
	/**
	 * Get the current settings for a MargedMarketRouter.
	 * 
	 * @param modulename Name of the MergedMarketRouter module.
	 * @return Properties containing current settings of this module.
	 * @throws RemoteException thrown if service fails.
	 */
	@GET
	@Path("mergedmarketrouter/{modulename}")
	@Produces(MediaType.APPLICATION_JSON)
	public Properties getSettings(@PathParam("modulename") String modulename) throws RemoteException;
	
	/**
	 * Set the default hold time value for a DelayedBBookGenerator module.
	 * 
	 * @param holdTime Time to hold orders in milliseconds.
	 * @param modulename Name of the DelayedBBookGenerator module to set time for.
	 * 
	 * @throws MalformedObjectNameException
	 * @throws InstanceNotFoundException
	 * @throws NullPointerException
	 * @throws ReflectionException
	 * @throws MBeanException
	 * @throws RemoteException
	 * @throws ETSAccessException
	 */
	@POST
	@Path("delayedbbookgenerator/defaultholdtime")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void setDelayedBBookGeneratorDefaultHoldTime(int holdTime,@QueryParam("modulename") String modulename) throws MalformedObjectNameException, InstanceNotFoundException, NullPointerException, ReflectionException, MBeanException, RemoteException, ETSAccessException;
	
	/**
	 * Get the per-group hold times for a DelayedBBookGenerator module.
	 * 
	 * @param modulename Name of the module to get times for.
	 * @return Map of group ids to default hold times in milliseconds.
	 * 
	 * @throws RemoteException
	 * @throws ETSAccessException thrown if user has no permission to access this data.
	 */
	@GET
	@Path("delayedbbookgenerator/{modulename}/groupholdtimes")
	@Produces(MediaType.APPLICATION_JSON)
	public Map<Integer,Integer> getDelayedBBookGeneratorGroupHoldTimes(@PathParam("modulename") String modulename) throws RemoteException, ETSAccessException;
	
	/**
	 * Set the group hold times for a DelayedBBookGenerator module.
	 * 
	 * @param holdTimes Map of group ids to hold times in milliseconds.
	 * @param modulename Name of module to configure.
	 * 
	 * @throws MalformedObjectNameException
	 * @throws InstanceNotFoundException
	 * @throws NullPointerException
	 * @throws ReflectionException
	 * @throws MBeanException
	 * @throws RemoteException
	 * @throws ETSAccessException
	 */
	@POST
	@Path("delayedbbookgenerator/groupholdtimes")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void setDelayedBBookGeneratorGroupHoldTimes(Map<Integer,Integer> holdTimes,@QueryParam("modulename") String modulename) throws MalformedObjectNameException, InstanceNotFoundException, NullPointerException, ReflectionException, MBeanException, RemoteException, ETSAccessException;
	
	/**
	 * Get the per-destination hold times for a DelayedBBookGenerator.
	 * 
	 * @param modulename Name of the DelayedBBookGenerator.
	 * @return Map of destination ids to hold times.
	 * 
	 * @throws RemoteException
	 * @throws NumberFormatException
	 * @throws UserManagementException
	 * @throws ETSAccessException thrown if user has no permissions to access this data.
	 */
	@GET
	@Path("delayedbbookgenerator/{modulename}/destholdtimes")
	@Produces(MediaType.APPLICATION_JSON)
	public Map<Integer,Integer> getDelayedBBookGeneratorDestinationHoldTimes(@PathParam("modulename") String modulename) throws RemoteException, NumberFormatException, UserManagementException, ETSAccessException;
	
	/**
	 * Set the per-destination DelayedBBookGenerator hold times for the given generator module.
	 * 
	 * @param holdTimes Map of destination ids to hold times in milliseconds.
	 * @param modulename Name of the DelayedBBookGenerator to configure.
	 * 
	 * @throws RemoteException
	 * @throws UserManagementException
	 * @throws InstanceNotFoundException
	 * @throws MalformedObjectNameException
	 * @throws NumberFormatException
	 * @throws ReflectionException
	 * @throws MBeanException
	 * @throws NullPointerException
	 * @throws ETSAccessException thrown if permission is denied.
	 */
	@POST
	@Path("delayedbbookgenerator/destholdtimes")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void setDelayedBBookGeneratorDestinationHoldTimes(Map<Integer,Integer> holdTimes,@QueryParam("modulename") String modulename) throws RemoteException, UserManagementException, InstanceNotFoundException, MalformedObjectNameException, NumberFormatException, ReflectionException, MBeanException, NullPointerException, ETSAccessException;
	
	/**
	 * Get the map of group ids to destination ids used to generate orders by the given DelayedBBookGenerator.
	 * 
	 * @param modulename Name of the DelayedBBookGenerator.
	 * @return Map of group ids to destination ids.
	 * 
	 * @throws RemoteException
	 * @throws UserManagementException
	 */
	@GET
	@Path("delayedbbookgenerator/{modulename}/groupDestMap")
	@Produces(MediaType.APPLICATION_JSON)
	public Map<Integer,Integer> getDelayedBBookGeneratorGroupDestinationMap(@PathParam("modulename") String modulename) throws RemoteException, UserManagementException;
	
	/**
	 * Set the mapping of group id to destination id of generated orders for a given DelayedBBookGenerator.
	 * 
	 * @param groupDestMap Map of group ids to destination ids.
	 * @param modulename Name of the module to configure.
	 * 
	 * @throws RemoteException
	 * @throws UserManagementException
	 * @throws ETSAccessException
	 */
	@POST
	@Path("delayedbbookgenerator/groupDestMap")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void setDelayedBBookGeneratorGroupDestinationMap(Map<Integer,Integer> groupDestMap,@QueryParam("modulename") String modulename) throws RemoteException, UserManagementException, ETSAccessException;
	
	/**
	 * Save a set of user gateway credentials.
	 * 
	 * @param credentials the credentials to save.
	 * 
	 * @throws RemoteException
	 */
	@POST
	@Path("gateways/usergatewaycredentials")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void setUserGatewayCredentials(Credentials<String,String> credentials) throws RemoteException;
	
	/**
	 * <p>
	 * Get a set of user gateway Credentials for a given userid.
	 * </p>
	 * <p>
	 * <em>NOTE:</em> Currently there is no support for a scenario where multiple credentials exist per-user for different (or the same)
	 * gateway(s). This will probably have to change...
	 * </p>
	 * 
	 * @param userid id of the user to recover credentials for.
	 * @return user's credentials.
	 * 
	 * @throws RemoteException
	 */
	@GET
	@Path("gateways/{userid}/usergatewaycredentials")
	@Produces(MediaType.APPLICATION_JSON)
	public Credentials<String,String> getUserGatewayCredentials(@PathParam("userid") int userid) throws RemoteException;
	
	/**
	 * Get all system events.
	 * 
	 * @return List<ISystemEvent> all recorded system events.
	 * @throws Exception
	 */
	@GET
	@Path("systemevents/all")
	@Produces(MediaType.APPLICATION_JSON)
	public List<ISystemEvent> getSystemEvents() throws Exception;
	
	/**
	 * Add or update an account. A new account should have accountid 0.
	 * 
	 * @param account Account the account to add or update.
	 * @return int id of the account
	 * @throws OMSOrderServiceFault if operation is not permitted or an attempt is made to update a non-existent account.
	 * @throws RemoteException 
	 */
	@POST
	@Path("accounts/new")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.TEXT_PLAIN)
	public int saveAccount(Account account) throws OMSOrderServiceFault, RemoteException;
	
	/**
	 * Delete the account with the given ID. This is a hard delete, but requires associated data to be removed
	 * first (IE orders and tickets).
	 *  
	 * @param accountid Internal int id of the account.
	 * @throws RemoteException
	 * @throws UserManagementException thrown if the account cannot be deleted.
	 * @throws ETSAccessException thrown if the user has insufficient permission.
	 */
	@POST
	@Path("accounts/{id}/delete")
	@Produces(MediaType.APPLICATION_JSON)
	public void deleteAccount(@PathParam("id") int accountid) throws RemoteException, UserManagementException, ETSAccessException;
	
	/**
	 * Move all tickets and associated orders and executions to the retired data cache. Associated positions will also be zeroed out.
	 * 
	 * @param accountid id of the account.
	 * 
	 * @throws RemoteException
	 * @throws UserManagementException
	 * @throws ETSAccessException thrown if the user has insufficient permissions.
	 */
	@POST
	@Path("accounts/{id}/retireTickets")
	@Produces(MediaType.APPLICATION_JSON)
	public void retireAccountTickets(@PathParam("id") int accountid) throws RemoteException, UserManagementException, ETSAccessException;

	/**
	 * Clear all position adjustments from the given account.
	 * 
	 * @param accountid id of the account.
	 * 
	 * @throws RemoteException
	 * @throws UserManagementException
	 * @throws ETSAccessException
	 */
	@POST
	@Path("accounts/{id}/deleteadjustments")
	@Produces(MediaType.APPLICATION_JSON)
	public void deleteAdjustments(@PathParam("id") int accountid) throws RemoteException, UserManagementException, ETSAccessException;
	
	/**
	 * Add an adjustment to the given account.
	 * 
	 * @param adj PositionAdjustment object containing the parameters for the adjustment.
	 * 
	 * @throws RemoteException
	 */
	@POST
	@Path("accounts/adjustments/new")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void addAdjustment(PositionAdjustment adj) throws RemoteException;
	
	/**
	 * Get all adjustments for the given account.
	 * 
	 * @param accountid id of the account.
	 * @return array of PositionAdjustment objects describing all the adjustments on this account.
	 * 
	 * @throws RemoteException
	 * @throws UserManagementException
	 * @throws ETSAccessException
	 */
	@GET
	@Path("accounts/{id}/adjustments")
	@Produces(MediaType.APPLICATION_JSON)
	public PositionAdjustment[] getAdjustments(@PathParam("id") int accountid) throws RemoteException, UserManagementException, ETSAccessException;
	
	/**
	 * Get all positions associated with a given account.
	 * 
	 * @param acctid Marx id of the account.
	 * @return Position[] all open positions associated with this account
	 * @throws RemoteException on failure to process request
	 */
	@GET
	@Path("accounts/{id}/positions")
	@Produces(MediaType.APPLICATION_JSON)
	public Position[] getAccountPositions(@PathParam("id") int acctid) throws RemoteException;

	/**
	 * Get all accounts owned by the given company.
	 * 
	 * @param companyid Marx id of the company
	 * @return Account[] all accounts owned by the company.
	 * @throws OMSOrderServiceFault if the request cannot be filled. Usually a permission error
	 * @throws RemoteException on failure to process request
	 * @throws UserManagementException 
	 * @throws ETSAccessException 
	 */
	@GET
	@Path("companies/{id}/accounts")
	@Produces(MediaType.APPLICATION_JSON)
	public Account[] getCompanyAccounts(@PathParam("id") final int companyid) throws OMSOrderServiceFault, RemoteException, UserManagementException, ETSAccessException;

	/**
	 * Get Destination information on all destinations which the given company has permission 
	 * to route orders to.
	 * 
	 * @param companyid Marx id of the company
	 * @return DestinationInfo[] info on each destination
	 * @throws RemoteException on failure to process request
	 */
	@GET
	@Path("destinations/info/company/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	public DestinationInfo[] getCompanyDestinationInfo(@PathParam("id") final int companyid) throws RemoteException;

	/**
	 * Get destination objects for all destinations configured for this system.
	 * 
	 * @return Destinations info on each destination
	 * @throws RemoteException on failure to process request
	 * @throws ETSAccessException 
	 */
	@GET
	@Path("destinations/all")
	@Produces(MediaType.APPLICATION_JSON)
	public Set<Destination> getAllDestinations() throws RemoteException, ETSAccessException;
	
	/**
	 * Get ids of destinations and associated markets which can be accessed via each one. 
	 * 
	 * @return List<Integer[]> array of pairs of integer arrays: 0->destinationID, 1->exchangeID
	 * @throws RemoteException on failure to process request
	 */
	@GET
	@Path("destinations/markets/all")
	@Produces(MediaType.APPLICATION_JSON)
	public List<Integer[]> getAllDestinationMarkets() throws RemoteException;
	
	/**
	 * <p>
	 * Get destination information for all destinations configured for this system.
	 * </p>
	 * <p>
	 * <em>Note:</em> This returns DestinationInfo objects, which contain complete mappings of associated markets,
	 * allowed order types and other parameters. This is the preferred mechanism for client applications to discover
	 * and present available order routing options to users, etc as it avoids many repeated service calls otherwise required
	 * to access the various categories of data and reconstruct the same information on the client side.
	 * 
	 * @return DestinationInfo[] info on each destination
	 * @throws RemoteException on failure to process request
	 * @throws OrderDBException 
	 */
	@GET
	@Path("destinations/info")
	@Produces(MediaType.APPLICATION_JSON)
	public DestinationInfo[] getAllDestinationInfo() throws RemoteException, OrderDBException;

	/**
	 * <p>
	 * Get information on a specific destination.
	 * </p>
	 * <p>
	 * <em>Note:</em> This is the preferred method for clients to use to recover information about available order
	 * routing options as it avoids many repeated round-trips otherwise required to get the various categories of
	 * information.
	 * </p>
	 * 
	 * @param destinationid int id of the destination.
	 * @return DestinationInfo information on the given destination.
	 * @throws OMSOrderServiceFault business level error, usually permissions.
	 * @throws RemoteException on failure to process request.
	 */
	@GET
	@Path("destinations/info/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	public DestinationInfo getDestinationInfo(@PathParam("id") final int destinationid) throws OMSOrderServiceFault, RemoteException;

	/**
	 * Get all exchanges which the given account can trade on.
	 * 
	 * @param acctid id of the account.
	 * @return All the exchanges that the account can trade on.
	 * @throws RemoteException 
	 */
	@GET
	@Path("accounts/{id}/markets")
	@Produces(MediaType.APPLICATION_JSON)
	public Set<Exchange> getAccountMarkets(@PathParam("id") int acctid) throws RemoteException;
	
	/**
	 * Get information on all destinations the current user is permitted to route orders to.
	 * 
	 * @return DestinationInfo[] info on each destination
	 * @throws OMSOrderServiceFault business level error, usually permissions.
	 * @throws RemoteException on failure to process request.
	 * @throws OrderDBException 
	 * @throws ETSAccessException 
	 */
	@GET
	@Path("destinations/info/user")
	@Produces(MediaType.APPLICATION_JSON)
	public DestinationInfo[] getUserDestinationInfo() throws OMSOrderServiceFault, RemoteException, OrderDBException, ETSAccessException;
	
	/**
	 * <p>
	 * Save new or updated information on a Destination. An id of 0 indicates a new destination.
	 * </p>
	 * <p>
	 * <em>Note:</em> For whatever reason this method does not currently return the id of the destination. The
	 * saveDestinationInfo method is usually preferable.
	 * 
	 * @param dest
	 * @throws RemoteException
	 */
	@POST
	@Path("destinations/save")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void saveDestination(Destination dest) throws RemoteException;

	/**
	 * Save a destination and all associated option information and market mappings.
	 * 
	 * @param destInfo
	 * @throws RemoteException
	 */
	@POST
	@Path("destinations/info/save")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void saveDestinationInfo(DestinationInfo destInfo) throws RemoteException;
	
	/**
	 * Get the name of the most permissive role the current user has. This is useful when a client application wants
	 * to present role-specific options. The hierarchy is 'administrator', 'companyadmin', 'admin' (department administrator), and 'trader'.
	 * 
	 * @return String name of most permissive role for this user.
	 */
	@GET
	@Path("roles/primary")
	@Produces(MediaType.TEXT_PLAIN)
	public String getPrimaryRole();
	
	/**
	 * Get the IDs assigned to the currently authenticated user.
	 * 
	 * @return int[] 0 is user id, 1 is department id, 2 is company id..
	 * @throws ETSAccessException 
	 */
	@GET
	@Path("userids")
	@Produces(MediaType.APPLICATION_JSON)
	public int[] getUserIDs() throws ETSAccessException;

	/**
	 * Place a new order. 
	 * 
	 * @param order Order the order to place.
	 * @return LogEntry currently this is always null.
	 * @throws OMSOrderServiceFault on business level error.
	 * @throws RemoteException on failure.
	 * @throws ETSAccessException 
	 */
	@POST
	@Path("orders/place")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public LogEntry placeOrder(Order order) throws OMSOrderServiceFault, RemoteException, ETSAccessException;
	
	/**
	 * Place a 'Trigger' and an associated order. This is used to open a position and place a stop-loss or take-profit which will be entered into the
	 * same destination market when the triggering order fills. Cancellation or replacement of the trigger will also affect the associated TP/SL leg. Note
	 * that this is a simple type of fixed 'strategy'. Currently the full OMS strategy mechanism is not exposed via REST.
	 * 
	 * 
	 * @param trigger
	 * @param order
	 * @return
	 * @throws OMSOrderServiceFault
	 * @throws RemoteException
	 * @throws ETSAccessException
	 */
	@POST
	@Path("orders/placeTrigger")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public LogEntry placeTriggerOrder(Order trigger, Order order) throws OMSOrderServiceFault, RemoteException, ETSAccessException;

	/**
	 * Replace an existing order. The destinations rules will determine which fields are allowed to be updated when replacing.
	 * 
	 * @param replacement Order the replacement order.
	 * @return LogEntry currently always null.
	 * @throws OMSOrderServiceFault on business level error.
	 * @throws RemoteException on failure.
	 * @throws ETSAccessException 
	 */
	@POST
	@Path("orders/{id}/replace")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@Deprecated
	public LogEntry replaceOrder(Order replacement) throws OMSOrderServiceFault, RemoteException, ETSAccessException;

	/**
	 * Replace an existing order. The destinations rules will determine which fields are allowed to be updated when replacing.
	 * 
	 * @param replacement Order the replacement order.
	 * @return LogEntry currently always null.
	 * @throws OMSOrderServiceFault on business level error.
	 * @throws RemoteException on failure.
	 * @throws ETSAccessException 
	 */
	@POST
	@Path("orders/replace")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public LogEntry replaceOrder2(Order replacement) throws OMSOrderServiceFault, RemoteException, ETSAccessException;
	
	/**
	 * Cancel an existing order. Note that order needs only the id or CustOrderId field set in order to identify which order to cancel, other values are not
	 * used.
	 * 
	 * @param order Order the order to be canceled.
	 * @return LogEntry currently always null.
	 * @throws OMSOrderServiceFault on business level error.
	 * @throws RemoteException on failure.
	 * @throws ETSAccessException 
	 */
	@POST
	@Path("orders/{id}/cancel")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@Deprecated
	public LogEntry cancelOrder(Order order) throws OMSOrderServiceFault, RemoteException, ETSAccessException;

	/**
	 * Cancel an existing order. Note that order needs only the id or CustOrderId field set in order to identify which order to cancel, other values are not
	 * used.
	 * 
	 * @param order Order the order to be canceled.
	 * @return LogEntry currently always null.
	 * @throws OMSOrderServiceFault on business level error.
	 * @throws RemoteException on failure.
	 * @throws ETSAccessException 
	 */
	@POST
	@Path("orders/cancel")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public LogEntry cancelOrder2(Order order) throws OMSOrderServiceFault, RemoteException, ETSAccessException;
	
	/**
	 * Dock an order. Docked orders are entered into the database but are not routed.
	 * 
	 * @param order Order the new order.
	 * @return LogEntry currently always null.
	 * @throws OMSOrderServiceFault on business level error.
	 * @throws RemoteException on failure.
	 * @throws ETSAccessException 
	 */
	@POST
	@Path("orders/dock")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public LogEntry dockOrder(Order order) throws OMSOrderServiceFault, RemoteException, ETSAccessException;

	/**
	 * Undock an order. A previously docked order is released.
	 * 
	 * @param order Order the new order.
	 * @return LogEntry currently always null.
	 * @throws OMSOrderServiceFault on business level error.
	 * @throws RemoteException on failure.
	 * @throws ETSAccessException 
	 */
	@POST
	@Path("orders/{id}/undock")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public LogEntry undockOrder(Order order) throws OMSOrderServiceFault, RemoteException, ETSAccessException;

	/**
	 * Get all 'active' orders owned by the current user. These are orders which are not currently filled, canceled, or 
	 * rejected etc and should be active. The exact definition of 'active' is subject to internal OMS business logic and 
	 * may not precisely reflect any specific state. Clients can use findOrders() to perform precise searches of all 
	 * non-retired orders.
	 * 
	 * @return Order[] active orders.
	 * @throws RemoteException on failure.
	 * @throws ETSAccessException 
	 */
	@GET
	@Path("orders/active")
	@Produces(MediaType.APPLICATION_JSON)
	public Order[] getUserActiveOrders() throws RemoteException, ETSAccessException;

	/**
	 * Get all executions for a given order id.
	 * 
	 * @param orderid int internal order id of order to get executions for.
	 * @return Execution[] executions for the given order.
	 * @throws RemoteException on failure.
	 */
	@GET
	@Path("orders/{id}/executions")
	@Produces(MediaType.APPLICATION_JSON)
	public Execution[] getOrderExecutions(@PathParam("id") final int orderid) throws RemoteException;
	
	/**
	 * <p>
	 * Set the 'source' which the client is requesting the OMS send orders to them from. This can be any one of:<br/>
	 * 
	 * <ul>
	 * <li><em>COMPANY</em> - collect all order events for the entire company to which the current user belongs.</li> 
	 * <li><em>DEPARTMENT</em> - collect all order events for the entire department to which the current user belongs.</li>
	 * <li><em>USER</em> - collect all order events for the current user.</li>
	 * <li><em>UNSUBSCRIBE</em> - stop collecting order events. This should be invoked if possible when a client no longer wishes to interact with
	 * the OMS</li> 
	 * </ul>
	 * </p>
	 * <p>
	 * <em>Note:</em> Users will require the correct role in order to receive data from other users in their COMPANY or DEPARTMENT, otherwise only the
	 * properly permissioned order event flow will be visible (IE you will never see orders from another company, and only from another user or department
	 * if you are respectively a department or company adim user). 
	 * </p>
	 * 
	 * @param etype
	 * @throws OMSOrderServiceFault
	 * @throws RemoteException
	 * @throws ETSAccessException
	 */
	@GET
	@Path("orders/eventsource/{type}")
	public void setOrderEventSource(@PathParam("type") String etype) throws OMSOrderServiceFault, RemoteException, ETSAccessException;
	
	/**
	 * <p>
	 * @See setOrderEventSource
	 * 
	 * This function is identical to the non-history version except it informs the OMS that the user requires a complete dump of the current status
	 * of all orders in the scope provided by the etype parameter. </p>
	 * <p>
	 * <em>Note:</em> This can produce a <em>large</em> amount of data in the COMPANY or DEPARTMENT scope, or for a very active USER. 
	 */
	@GET
	@Path("orders/eventsource/{type}/history")
	public void setOrderEventSourceWithHistory(@PathParam("type") String etype) throws OMSOrderServiceFault, RemoteException, ETSAccessException;

	/**
	 * <p>
	 * Get all events queued for this client since the last call. setOrderEventSource(String) should be called to define the scope 
	 * of events requested and announce the client to the OMS Subscription Manager. </p>
	 * <p>
	 * This function and @See setOrderEventSource together implement a polling mechanism. A client can subscribe via setOrderEventSource and then
	 * poll via getOrderEvents, incrementally receiving event messages generated since the last call. 
	 * </p>
	 * <p>
	 * NOTE: This is an alternate version that MIGHT get around object serialization deficiencies in Jackson which prevents the ETSEventCollection
	 * version from working with a Jackson client. Otherwise it is functionally identical and you can call either (or both) as you wish.
	 * </p>
	 * 
	 * @return ETSEventCollection A group of ETSEvent objects describing open orders, state changes (executions),
	 * and error conditions related to subscribed trades.
	 * @throws OMSOrderServiceFault on business error.
	 * @throws RemoteException on failure.
	 * @throws ETSAccessException 
	 */
	@GET
	@Path("orders/events2")
	@Produces(MediaType.APPLICATION_JSON)
	public List<? extends ETSEventMessage> getOrderEvents2() throws OMSOrderServiceFault, RemoteException, ETSAccessException;

	/**
	 * <p>
	 * Get all events queued for this client since the last call. setOrderEventSource(String) should be called to define the scope 
	 * of events requested and announce the client to the OMS Subscription Manager. </p>
	 * <p>
	 * This function and @See setOrderEventSource together implement a polling mechanism. A client can subscribe via setOrderEventSource and then
	 * poll via getOrderEvents, incrementally receiving event messages generated since the last call. 
	 * </p>
	 * 
	 * @return ETSEventCollection A group of ETSEvent objects describing open orders, state changes (executions),
	 * and error conditions related to subscribed trades.
	 * @throws OMSOrderServiceFault on business error.
	 * @throws RemoteException on failure.
	 * @throws ETSAccessException 
	 */
	@GET
	@Path("orders/events")
	@Produces(MediaType.APPLICATION_JSON)
	public ETSEventCollection getOrderEvents() throws OMSOrderServiceFault, RemoteException, ETSAccessException;

	/**
	 * Get the current state of an order with the given id. This version calculates avg price.
	 * 
	 * @param id int internal id of order.
	 * @return Order the state of the order.
	 * @throws RemoteException on failure.
	 * @throws OrderDBException 
	 */
	@GET
	@Path("orders/{id}/calculations")
	@Produces(MediaType.APPLICATION_JSON)
	public Order getOrderCalculations(@PathParam("id") final int id) throws RemoteException, OrderDBException;

	/**
	 * Get basic information on a given destination.
	 * 
	 * @param id int id of the destination
	 * @return Destination information on the give destination.
	 * @throws RemoteException on failure.
	 */
	@GET
	@Path("destinations/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	public Destination getDestination(@PathParam("id") final int id) throws RemoteException;

	/**
	 * Get basic information on a given account.
	 * 
	 * @param id int internal id of an account.
	 * @return Account basic information on this account.
	 * @throws RemoteException on failure.
	 * @throws UserManagementException 
	 * @throws ETSAccessException 
	 */
	@GET
	@Path("accounts/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	public Account getAccount(@PathParam("id") final int id) throws RemoteException, UserManagementException, ETSAccessException;

	/**
	 * Get all destinations the current user is permitted to route order to.
	 * 
	 * @return Destination[] all permitted destinations.
	 * @throws RemoteException on failure.
	 * @throws ETSAccessException 
	 */
	@GET
	@Path("userDestinations")
	@Produces(MediaType.APPLICATION_JSON)
	public Destination[] getUserDestinations() throws RemoteException, ETSAccessException;

	/**
	 * Look up accounts which match a given set of search criteria.
	 * 
	 * @param filter AccountFilter search parameters.
	 * @return Account[] all accounts which match the query and which the current user is permitted to view.
	 * @throws RemoteException on failure.
	 * @throws UserManagementException 
	 * @throws ETSAccessException 
	 */
	@POST
	@Path("findAccounts")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Account[] findAccounts(com.tradedesksoftware.ets.omsweb.AccountFilter filter) throws RemoteException, UserManagementException, ETSAccessException;

	/**
	 * Get all accounts which the current user is permitted to view.
	 * 
	 * @return Account[] user's accounts.
	 * @throws RemoteException on failure.
	 * @throws ETSAccessException 
	 */
	@GET
	@Path("accounts")
	@Produces(MediaType.APPLICATION_JSON)
	public Account[] getUserAccounts() throws RemoteException, ETSAccessException;

	/**
	 * Get orders which match a set of search parameters. The returned set of orders will be filtered to remove any which the user is not 
	 * permitted for. This may result in an empty zero-length array.
	 * 
	 * @param filter OrderFilter search parameters.
	 * @return Order[] matching orders.
	 * @throws RemoteException on failure.
	 */
	@POST
	@Path("findOrders")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Order[] findOrders(OrderFilter filter) throws RemoteException;

	
	/**
	 * Get the current state of an order with the given id.
	 * 
	 * @param id int internal id of order.
	 * @return Order the state of the order.
	 * @throws RemoteException on failure.
	 */
	@GET
	@Path("orders/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	public Order getOrder(@PathParam("id") final int id) throws RemoteException;

	
	/**
	 * DTO used to marshal a list of all the enums.
	 *
	 */
	public static class Enums {
		public OrderTypes[] orderTypes = OrderTypes.values();
		public OrderStatuses[] orderStatuses = OrderStatuses.values();
		public TimesInForce[] tifs = TimesInForce.values();
		public Sides[] sides = Sides.values();
		public ExecutionTypes[] executionTypes = ExecutionTypes.values();
		public ExecutionInstructions[] executionInstructions = ExecutionInstructions.values();
		public AccountTypes[] accountTypes = AccountTypes.values();
		public TicketStatuses[] ticketStatuses = TicketStatuses.values();
		public InstrumentTypes[] instrumentTypes = InstrumentTypes.values();
	}
	
	public static final Enums enums = new Enums();
	
	@GET
	@Path("meta/enums")
	@Produces(MediaType.APPLICATION_JSON)
	public Enums getEnums();
	
	/**
	 * Return a list of all order types.
	 * 
	 * @return array of order types.
	 */
	@GET
	@Path("meta/orders/types")
	@Produces(MediaType.APPLICATION_JSON)
	public OrderTypes[] getOrderTypes();
	
	/**
	 * Return a list of all order states.
	 * 
	 * @return array of order states.
	 */
	@GET
	@Path("meta/orders/states")
	@Produces(MediaType.APPLICATION_JSON)
	public OrderStatuses[] getOrderStates();

	/**
	 * Return a list of all TimeInForce values.
	 * 
	 * @return array of TIFs.
	 */
	@GET
	@Path("meta/orders/tifs")
	@Produces(MediaType.APPLICATION_JSON)
	public TimesInForce[] getOrderTIFs();
	
	/**
	 * Return a list of all Sides values.
	 * 
	 * @return array of sides.
	 */
	@GET
	@Path("meta/orders/sides")
	@Produces(MediaType.APPLICATION_JSON)
	public Sides[] getOrderSides();
	
	/**
	 * Return list of all execution types.
	 * 
	 * @return array of ExecutionTypes.
	 */
	@GET
	@Path("meta/executions/types")
	@Produces(MediaType.APPLICATION_JSON)
	public ExecutionTypes[] getExecutionTypes();
	
	/**
	 * Return list of all execution instructions.
	 * 
	 * @return array of ExecutionEinstructions.
	 */
	@GET
	@Path("meta/executions/instructions")
	@Produces(MediaType.APPLICATION_JSON)
	public ExecutionInstructions[] getExecutionInstructions();

	/**
	 * Return a list of account types.
	 * 
	 * @return array of all AccountTypes.
	 */
	@GET
	@Path("meta/accounts/types")
	@Produces(MediaType.APPLICATION_JSON)
	public AccountTypes[] getAccountTypes();

	/**
	 * Return list of ticket statuses.
	 * 
	 * @return array of all TicketStatuses.
	 */
	@GET
	@Path("meta/tickets/states")
	@Produces(MediaType.APPLICATION_JSON)
	public TicketStatuses[] getTicketStates();
	
	/**
	 * Return list of all instrument types.
	 * 
	 * @return array of InstrumentTypes.
	 */
	@GET
	@Path("meta/instruments/types")
	@Produces(MediaType.APPLICATION_JSON)
	public InstrumentTypes[] getInstrumentTypes();
	
	/**
	 * Get all known sequence sources.
	 * 
	 * @return List<SequenceSource> list of known sequence sources
	 * @throws RemoteException on failure.
	 */
	@GET
	@Path("sequences/all")
	@Produces(MediaType.APPLICATION_JSON)
	public List<SequenceSource> getAllSequenceSources() throws RemoteException;
	
	/**
	 * Delete a particular sequence source.
	 * 
	 * @param int sourceID ID of source to delete
	 * @throws RemoteException on failure.
	 */
	@POST
	@Path("sequences/delete")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void deleteSequenceSource(int sourceID) throws RemoteException;
	
	/**
	 * Get all allocations for given sequence source
	 * 
	 * @param sourceID int ID of source for which to list allocations
	 * @return List<SequenceAllocation> list of allocations for the given source 
	 * @throws RemoteException on failure.
	 */
	@GET
	@Path("sequences/allocations/{sourceID}/list")
	@Produces(MediaType.APPLICATION_JSON)
	public List<SequenceAllocation> getSequenceAllocationList(@PathParam("sourceID") int sourceID) throws RemoteException;
	
	/**
	 * Add or update a new sequence source.
	 * 
	 * @param SequenceSource source to save or create
	 * @throws RemoteException on failure.
	 */
	@POST
	@Path("sequences/save")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public SequenceSource saveSequenceSource(SequenceSource source) throws RemoteException;
	
	/**
	 * Romeove all allocations for given sequence source
	 * 
	 * @param sourceID int ID of source for which to remove allocations 
	 * @throws RemoteException on failure.
	 */
	@GET
	@Path("sequences/allocations/{sourceID}/clear")
	@Produces(MediaType.APPLICATION_JSON)
	public void clearSequenceSource(@PathParam("sourceID") int sourceID) throws RemoteException;
	
	/**
	 * Allocate a new sequence source.
	 * 
	 * @param int sourceID ID of source to update, 0 for new
	 * @param int size of new allocation to request
	 * @throws RemoteException on failure.
	 */
	@POST
	@Path("sequences/allocations/{sourceID}/new/{allocSize}")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void addSequenceAllocation(@PathParam("sourceID")int sourceID, @PathParam("allocSize")int allocSize) throws RemoteException;

	/**
	 * Try a context lookup of a property value in the ear properties of the OMS application EAR.
	 * 
	 * @param propertyName String name of property to look up
	 * @return String value of looked-up property
	 * @throws RemoteException thrown if the property doesn't exist or cannot be recovered.
	 */
	@GET
	@Path("earproperties")
	@Produces(MediaType.TEXT_PLAIN)
	public String getEarProperty(@QueryParam("propname") String propertyName) throws RemoteException;
	
	/**
	 * Get all allocations for given sequence source
	 * 
	 * @param sourceID int ID of source for which to list allocations
	 * @return List<SequenceAllocation> list of allocations for the given source 
	 * @throws RemoteException on failure.
	 */
	@POST
	@Path("greylabels/bookset")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public List<BookType> getGreyLabelBookSet(BookTypeFilter filter) throws RemoteException;
	
	/**
	 * Get all equity calculations for a given grey label.
	 * 
	 * @param greyLabelId int ID of greylabel (currently group ID)
	 * @return DashboardInfo Equity calculations.
	 * @throws RemoteException on failure.
	 */
	@GET
	@Path("greylabels/dashboard")
	@Produces(MediaType.APPLICATION_JSON)
	public DashboardInfo getDashboardInfo(@QueryParam("greyLabelId") int greyLabelId) throws RemoteException;
	
	/**
	 * Get grey label visible to logged-in user (currently based on user's group ID)
	 * 
	 * @return GreyLabel information
	 * @throws RemoteException on failure.
	 * @throws ETSAccessException 
	 */
	@GET
	@Path("greylabels")
	@Produces(MediaType.APPLICATION_JSON)
	public GreyLabel getGreyLabel() throws RemoteException, ETSAccessException;
	
	/**
	 * Get all grey label information.
	 * 
	 * @return List<GreyLabel> all grey label information
	 * @throws RemoteException on failure.
	 */
	@GET
	@Path("greylabels/all")
	@Produces(MediaType.APPLICATION_JSON)
	public List<GreyLabel> getAllGreyLabels() throws RemoteException;
	
	/**
	 * Add or update a grey label.
	 * 
	 * @param greyLabel GreyLabel to update.
	 * @throws RemoteException on failuer.
	 */
	@POST
	@Path("greylabels/save")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void saveGreyLabel(GreyLabel greyLabel) throws RemoteException;
	
	/**
	 * Delete a grey label.
	 * 
	 * @param greyLabelId to delete.
	 * @throws RemoteException on failure.
	 */
	@POST
	@Path("greylabels/delete")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void deleteGreyLabel(int greyLabelId) throws RemoteException;
	
	/**
	 * Update user<->account mappings for a grey label.
	 * 
	 * @param glubObj Object containing new grey label user<->account mapping for a given grey label and mt4 ID
	 * @throws RemoteException on failure.
	 */
	@POST
	@Path("greylabels/users/accounts/update")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)	
	public void saveMT4User(GreyLabelPOSTObject glubObj)  throws RemoteException;
	
	/**
	 * Get equity for a specific account.
	 * 
	 * @param accountID int ID of account.
	 * @return BigDecimal equity of account.
	 * @throws RemoteException on failure.
	 */
	@GET
	@Path("greylabels/accounts/{accountID}/equity")
	@Produces(MediaType.APPLICATION_JSON)
	public BigDecimal getAccountEquity(@PathParam("accountID")int accountID) throws RemoteException;
	
	/**
	 * Get free margin for a specific account.
	 * 
	 * @param accountID int ID of account.
	 * @return BigDecimal free margin of account.
	 * @throws RemoteException on failure.
	 */
	@GET
	@Path("greylabels/accounts/{accountID}/freeMargin")
	@Produces(MediaType.APPLICATION_JSON)
	public BigDecimal getAccountFreeMargin(@PathParam("accountID")int accountID) throws RemoteException;

	/**
	 * Get required margin for a specific account.
	 * 
	 * @param accountID int ID of account.
	 * @return BigDecimal required margin of account.
	 * @throws RemoteException on failure.
	 */
	@GET
	@Path("greylabels/accounts/{accountID}/requiredMargin")
	@Produces(MediaType.APPLICATION_JSON)
	public BigDecimal getAccountRequiredMargin(@PathParam("accountID")int accountID) throws RemoteException;

	/**
	 * Get buying power for a specific account.
	 * 
	 * @param accountID int ID of account.
	 * @return BigDecimal buying power of account.
	 * @throws RemoteException on failure.
	 */
	@GET
	@Path("greylabels/accounts/{accountID}/buyingPower")
	@Produces(MediaType.APPLICATION_JSON)
	public BigDecimal getAccountBuyingPower(@PathParam("accountID")int accountID) throws RemoteException;

	/**
	 * Get balance for a specific account.
	 * 
	 * @param accountID int ID of account.
	 * @return BigDecimal balance of account.
	 * @throws RemoteException on failure.
	 */
	@GET
	@Path("greylabels/accounts/{accountID}/balance")
	@Produces(MediaType.APPLICATION_JSON)
	public BigDecimal getAccountBalance(@PathParam("accountID")int accountID) throws RemoteException;
	
}