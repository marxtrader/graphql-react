package com.tradedesksoftware.etsweb.rest;

/*
 * Created on Jan 30, 2012
 *
 * This code is the proprietary confidential property of TradeDesk
 * Software Inc and may not be redistributed or used for any other
 * purpose without the express consent of TradeDesk Software Inc.
 * 
 * Copyright 2012 TradeDesk Software Inc. All Rights Reserved
 */

import java.rmi.RemoteException;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.ext.Provider;

import com.tradedesksoftware.ets.core.entities.Exchange;
import com.tradedesksoftware.ets.core.entities.Instrument;
import com.tradedesksoftware.ets.core.entities.Route;
import com.tradedesksoftware.ets.core.exceptions.ETSAccessException;
import com.tradedesksoftware.ets.symbolmaster.Markups;
import com.tradedesksoftware.ets.symbolmaster.SymbolFilter;
import com.tradedesksoftware.ets.symbolmaster.SymbolMasterException;
import com.tradedesksoftware.feedhandler.core.Subscription.Level;

/**
 * 
 * Provides basic symbol master functionality via RESTEasy.
 * 
 * As a general note - return plaintext instead of JSON when returning primitives and strings rather than collections
 * or objects.
 * 
 * Browser-side JSON.parse() gets mad when you try to tell it to parse a single value and you're using the 
 * header media type to determine what to parse.
 * 
 * This API intentionally does not include market data subscription/retrieval mechanisms for now.
 * Clients wishing to use in-browser marketdata should implement a WebSockets connection instead, 
 * using a running com.tradedesksoftware.feedhandler.service.websockets.WebSocketServer on the
 * feedhandler side.  If a use case shows up later, we can implement the market data service from
 * SOAP here.
 * 
 * @author nsimpson
 *
 */
@Path("rest")
@Provider // Exception mapper provider
@Consumes(MediaType.TEXT_PLAIN)
@Produces(MediaType.TEXT_PLAIN)
public interface IMarketDataRESTServices {
	
	
	/**
	 * Return a set of Route objects describing all the possible sources of market data
	 * available for the given symbol.
	 * 
	 * @param symbol String ticker symbol to search for routes to.
	 * @return Route[] all available routes for the given data.
	 */
	@GET
	@Path("routes/{symbol}/all")
	@Produces(MediaType.APPLICATION_JSON)
	public Route[] getRoutes(@PathParam("symbol") final String symbol) throws SymbolMasterException, RemoteException;
	
	/**
	 * Get all exchanges known to the trading system that our user has permission to see.
	 * 
	 * @return Exchange[] all known exchanges.
	 * @throws RemoteException
	 */
	@GET
	@Path("exchanges/all")
	@Produces(MediaType.APPLICATION_JSON)
	public Exchange[] getExchanges() throws RemoteException;
	
	/**
	 * Return all market data routes which the current user is able to access.
	 * 
	 * @return Route[] permitted routes
	 * @throws RemoteException
	 * @throws ETSAccessException 
	 * @throws SymbolMasterException
	 */
	@GET
	@Path("routes/all/permitted")
	@Produces(MediaType.APPLICATION_JSON)
	public Set<Route> getAllPermittedRoutes() throws RemoteException, ETSAccessException;
	
	/**
	 * For a given symbol return all market data routes which the current user is able to access.
	 * 
	 * @param symbol String symbol
	 * @return Route[] permitted routes
	 * @throws RemoteException
	 * @throws ETSAccessException 
	 * @throws SymbolMasterException
	 */
	@GET
	@Path("routes/{symbol}/permitted")
	@Produces(MediaType.APPLICATION_JSON)
	public Set<Route> getPermittedRoutes(@PathParam("symbol") final String symbol) throws RemoteException, ETSAccessException;

	/**
	 * Clone an existing exchange. Returns the id assigned to the new
	 * exchange. 
	 * 
	 * @param exchangeid id of the exchange to clone
	 * @return int id of the new, cloned exchange
	 * 
	 * @throws SymbolMasterException
	 * @throws RemoteException
	 */
	@POST
	@Path("exchanges/clone")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public int cloneExchange(Integer exchangeid) throws RemoteException;
	
	/**
	 * Update or add an exchange to the known exchanges. Returns the id assigned to the
	 * exchange. If this is an existing exchange the id will be the same as before, otherwise
	 * it will be a newly assigned id for the new exchange.
	 * 
	 * @param exchange Exchange the data for the exchange.
	 * @return int id of the exchange.
	 * 
	 * @throws SymbolMasterException
	 * @throws RemoteException
	 */
	@POST
	@Path("exchanges/update")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public int updateExchange(Exchange exchange) throws RemoteException;
	
	/**
	 * Delete an exchange
	 * @param exchangeID Integer ID to delete
	 * @return boolean delete request successful.
	 * @throws SymbolMasterException 
	 * @throws RemoteException 
	 */
	@POST
	@Path("exchanges/delete")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void deleteExchange(Integer exchangeID) throws RemoteException;
	
	/**
	 * Update the symbol master data for an instrument, or add a new instrument to the
	 * symbolmaster. Returns the unique internal id of the symbol.
	 * 
	 * @param info Instrument the data to add/update.
	 * @return int id of the instrument.
	 * @throws SymbolMasterException
	 * @throws RemoteException
	 */
	@POST
	@Path("symbols/update")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public int updateSymbolInfo(Instrument info) throws RemoteException;

	/**
	 * Get a group of instruments in one call. This is highly efficient for instance when
	 * fetching all the instrument definitions related to a watch list.
	 * 
	 * @param ids int[] ids of instruments to get data for.
	 * @return Instrument[] array containing all the instruments.
	 * @throws RemoteException on failure.
	 */
	@POST
	@Path("symbols/all")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Instrument[] getInstruments(int[] ids) throws RemoteException;
	
	/**
	 * Delete an instrument
	 * @param instID Integer ID to delete
	 * @return boolean delete request successful.
	 * @throws SymbolMasterException 
	 * @throws RemoteException 
	 * @throws ETSAccessException 
	 */
	@POST
	@Path("symbols/delete")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public boolean deleteInstrument(Integer instID) throws RemoteException, SymbolMasterException, ETSAccessException;
	
	/**
	 * Get all symbols for a given exchange.
	 * @param exchangeid
	 * @return Set<Instrument> Instruments belonging to exchange ID
	 * @throws RemoteException
	 */
	@GET
	@Path("symbols/exchange/{exchangeid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Set<Instrument> getExchangeInstruments(@PathParam("exchangeid") final int exchangeid) throws RemoteException;
	
	/**
	 * Save multiple symbols for a specific carrier at once.
	 * @param instrumentSymbols Map<CarrierString,Map<InstrumentInteger,SymbolString>> of instruments to set symbol for
	 * @throws RemoteException
	 * @throws ETSAccessException 
	 */
	@POST
	@Path("symbols/carrier/saveMultiple")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void saveCarrierSymbols(Map<String, Map<Integer,String>> instrumentSymbols) throws RemoteException, ETSAccessException;
	
	/**
	 * Save a single symbol for a carrier
	 * @param instrumentID int ID of instrument to save
	 * @param carrierID String carrier ID/name
	 * @param carrierSymbol String new symbol
	 * @throws RemoteException
	 * @throws ETSAccessException 
	 */
	@GET
	@Path("symbols/carrier/{carrierID}/{instrumentID}/{carrierSymbol}")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void saveCarrierSymbol(@PathParam("instrumentID") int instrumentID, @PathParam("carrierID") String carrierID, @PathParam("carrierSymbol") String carrierSymbol) throws RemoteException, ETSAccessException;
	
	/**
	 * Get all destination symbols for a given destination (returns map of instruments to dest symbol)
	 * @param destid int ID of destination
	 * @return Map of instrument list for each destination symbol
	 * @throws RemoteException
	 */
	@GET
	@Path("symbols/destination/{destid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Map<String, List<Instrument>> getDestinationInstruments(@PathParam("destid") final int destid) throws RemoteException;
	
	@POST
	@Path("symbols/destination/saveMultiple")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void saveDestinationSymbols(Map<Integer,Map<Integer,String>> destSymbols) throws RemoteException, ETSAccessException;
	
	@GET
	@Path("symbols/destination/{destid}/{instrumentID}/{destSymbol}")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void saveDestinationSymbol(@PathParam("instrumentID") int instrumentID, @PathParam("destid") int destID, @PathParam("destSymbol") String destSymbol) throws RemoteException, ETSAccessException;
	
	/**
	 * Get all carrier symbols for a given exchange and carrier (returns map of instruments to carrier symbol)
	 * @param exchangeid
	 * @return Map of instrument list for each carrier symbol
	 * @throws RemoteException
	 */
	@GET
	@Path("symbols/exchange/{exchangeid}/{carrier}")
	@Produces(MediaType.APPLICATION_JSON)
	public Map<String, List<Instrument>> getAllExchangeCarrierInstruments(@PathParam("exchangeid") final int exchangeid,@PathParam("carrier") final String carrier) throws RemoteException;
	
	/**
	 * Get symbol info for all instruments which match the given filter. This allows for
	 * searching the symbol master on various criteria. The filter allows setting of
	 * various search parameters.
	 * 
	 * @param filter SymbolFilter the search criteria.
	 * @return Instrument[] all instruments matching the search.
	 * 
	 * @throws RemoteException
	 * @throws SymbolMasterException
	 */
	@POST
	@Path("symbols/search")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Set<Instrument> findSymbolInfo(SymbolFilter filter) throws RemoteException;

	/**
	 * Find routes matching various criteria.
	 * @param level
	 * @param carrier
	 * @param supplier
	 * @param symbol
	 * @param marketid
	 * @param protocol
	 * @return Set<Route> Set of Route data matching search criteria
	 * @throws RemoteException
	 */
	@GET
	@Path("routes/search")
	@Produces(MediaType.APPLICATION_JSON)
	public Set<Route> getMarketDataRoutes(@QueryParam ("level") Level level, @QueryParam ("carrier") String carrier, @QueryParam ("supplier") String supplier, @QueryParam ("symbol") String symbol, @QueryParam ("marketid") int marketid, @QueryParam ("protocol") String protocol) throws RemoteException;
	

	/**
	 * Get a list of all exchanges which list a given symbol. 
	 * 
	 * @param symbol String the symbol to query on.
	 * @return int[] market/exchange ids of all listing markets.
	 * @throws RemoteException on failure.
	 */
	@GET
	@Path("exchanges/{symbol}")
	@Produces(MediaType.APPLICATION_JSON)
	public List<Integer> getCandidateExchanges(@PathParam("symbol") final String symbol) throws RemoteException;
	
	/**
	 * Update the symbol master to store markups for an exchange.
	 * 
	 * @param markups Markups[] Array of Markup objects to save.
	 * @throws SymbolMasterException
	 * @throws RemoteException
	 * @throws ETSAccessException 
	 */
	@POST
	@Path("markups/update")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void saveMarkups(Markups[] markups) throws RemoteException, ETSAccessException;
	
	/**
	 * Get all markups known for market. 
	 * 
	 * @param marketid int ID of market
	 * @return Markups object containing known markups.
	 * @throws RemoteException on failure.
	 */
	@GET
	@Path("markups/{marketid}")
	@Produces(MediaType.APPLICATION_JSON)
	public List<Markups> getMarkupsForMarket(@PathParam("marketid") final int marketid) throws RemoteException;
	
	/**
	 * Get carrier list.
	 * @return List<String> of carriers
	 * @throws RemoteException
	 * @throws ETSAccessException 
	 */
	@GET
	@Path("routes/carriers/list")
	@Produces(MediaType.APPLICATION_JSON)
	public List<String> getAllCarriers() throws RemoteException, ETSAccessException;
	
	/**
	 * Get supplier list.
	 * @return List<String> of suppliers
	 * @throws RemoteException
	 */
	@GET
	@Path("routes/suppliers/list")
	@Produces(MediaType.APPLICATION_JSON)
	public List<String> getAllSuppliers() throws RemoteException;
	
	/**
	 * Get carrier-exchange mappings.
	 * @return List<String[]> where String[] is: String carrier, int exchangeID, String mappingName [feedexchangeid]
	 * @throws RemoteException
	 */
	@GET
	@Path("routes/carrierexchanges/list")
	@Produces(MediaType.APPLICATION_JSON)
	public List<String[]> getAllCarrierExchanges() throws RemoteException;
	
	/**
	 * Returns list of carrier supplier levels as String arrays.
	 * <p> For each array:
	 * <p>Array[0] = String supplier
	 * <br>Array[1] = String carrier
	 * <br>Array[2] = String levelid
	 * @return List&lt;String[]&gt; result
	 * @throws RemoteException
	 */
	@GET
	@Path("routes/levels/list")
	@Produces(MediaType.APPLICATION_JSON)
	public List<String[]> getAllCarrierSupplierLevels() throws RemoteException;
	
	/**
	 * Add a carrier
	 * @param carrierName String new carrier name
	 * @throws RemoteException
	 */
	@POST
	@Path("routes/carriers/add")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void addCarrier(String carrierName) throws RemoteException;
	
	/**
	 * Delete a carrier
	 * @param carrierName String name of carrier to delete.
	 * @throws RemoteException
	 */
	@POST
	@Path("routes/carriers/delete")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void deleteCarrier(String carrierName) throws RemoteException;
	
	/**
	 * Add a supplier
	 * @param supplierName String supplier name
	 * @throws RemoteException
	 */
	@POST
	@Path("routes/suppliers/add")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void addSupplier(String supplierName) throws RemoteException;
	
	/**
	 * Delete a supplier.
	 * @param supplierName String name of supplier to delete
	 * @throws RemoteException
	 */
	@POST
	@Path("routes/suppliers/delete")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void deleteSupplier(String supplierName) throws RemoteException;
	
	/**
	 * Add a carrier exchange mapping. Expects CarrierExchangePOSTObject JSON:<br/> 
	 *  carrier String name of carrier<br/>
	 *  exchangeID int internal exchange ID<br/>
	 *  feedID String carrier-specific feed name<br/>
	 * @param carrierExchange CarrierExchangePOSTObject JSON
	 * @throws RemoteException
	 */
	@POST
	@Path("routes/carrierexchanges/add")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void addCarrierExchange(CarrierExchangePOSTObject carrierExchange) throws RemoteException;
	
	/**
	 * Delete a carrier exchange mapping. Expects CarrierExchangePOSTObject JSON:<br/> 
	 *  carrier String name of carrier<br/>
	 *  exchangeID int internal exchange ID<br/>
	 *  feedID String carrier-specific feed name<br/>
	 * @param carrierExchange CarrierExchangePOSTObject JSON
	 * @throws RemoteException
	 */
	@POST
	@Path("routes/carrierexchanges/delete")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void deleteCarrierExchange(CarrierExchangePOSTObject carrierExchange) throws RemoteException;
	
	/**
	 * Add a carrier supplier level mapping. Expects CarrierSupplierLevelPOSTObject with:<br/>
	 *  carrier String name of carrier<br/>
	 *  supplier String name of supplier<br/>
	 *  levelID int ID corresponding to enum of market data level<br/>
	 * @param carrierSupplierLevel CarrierSupplierLevelPOSTObject JSON 
	 * @throws RemoteException
	 */
	@POST
	@Path("routes/levels/add")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void addCarrierSupplierLevel(CarrierSupplierLevelPOSTObject carrierSupplierLevel) throws RemoteException;
	
	/**
	 * Delete a carrier supplier level mapping. Expects CarrierSupplierLevelPOSTObject with:<br/>
	 *  carrier String name of carrier<br/>
	 *  supplier String name of supplier<br/>
	 *  levelID int ID corresponding to enum of market data level<br/>
	 * @param carrierSupplierLevel CarrierSupplierLevelPOSTObject JSON 
	 * @throws RemoteException
	 */
	@POST
	@Path("routes/levels/delete")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void deleteCarrierSupplierLevel(CarrierSupplierLevelPOSTObject carrierSupplierLevel) throws RemoteException;
	
	/**
	 * Add a new route. Expects Route JSON object with:<br/>
	 *  subtopic String subtopic name (default: feedhandler:8787)<br/>
	 *  carrier String carrier name<br/>
	 *  supplier String supplier name<br/>
	 *  levelID int ID corresponding to enum of market data level<br/> 
	 *  marketid int internal exchange ID<br/>
	 *  protocol String protocol (default: com.tradedesksoftware.feedhandler.feed.tcp.MarxFeed)<br/>
	 *  description String description of route
	 * @param route RoutePOSTObject JSON
	 * @throws RemoteException
	 */
	@POST
	@Path("routes/add")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void addRoute(RoutePOSTObject route) throws RemoteException;
	
	/**
	 * Delete a route. Expects Route JSON object with:<br/>
	 *  subtopic String subtopic name (default: feedhandler:8787)<br/>
	 *  carrier String carrier name<br/>
	 *  supplier String supplier name<br/>
	 *  levelID int ID corresponding to enum of market data level<br/> 
	 *  marketid int internal exchange ID<br/>
	 *  protocol String protocol (default: com.tradedesksoftware.feedhandler.feed.tcp.MarxFeed)<br/>
	 * @param route RoutePOSTObject JSON
	 * @throws RemoteException
	 */
	@POST
	@Path("routes/delete")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public void deleteRoute(RoutePOSTObject route) throws RemoteException;

}
