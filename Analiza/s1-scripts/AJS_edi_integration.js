// filepath: d:\GitHub\Pet-Factory\retailers3\Analiza\s1-scripts\AJS_edi_integration.js
// Cod specific S1 - AJS
// EDI Integration API functions for the PetFactory EDI connector

/**
 * Gets all EDI connectors with optional filtering
 * @param {Object} params Query parameters for filtering
 * @returns {Object} List of EDI connectors with success/error information
 */
function getEdiConnectors(params) {
    try {
        var query;
        var ds;
        var companyId = X.SYS.COMPANY;

        // Pregătim diferite variante de query în funcție de parametrii primiți
        if (params && params.trdr_retailer && params.trdr_client) {
            // Filtru după ambele criterii: retailer și client
            query = "SELECT c.CCCSFTP as id, c.CCCSFTP, c.TRDR_RETAILER, c.TRDR_CLIENT, c.URL, c.PORT, " +
                "c.USERNAME, c.PASSPHRASE, c.INITIALDIRIN, c.INITIALDIROUT, c.FINGERPRINT, c.PRIVATEKEY, " +
                "r.NAME as retailerName, cl.NAME as clientName " +
                "FROM CCCSFTP c " +
                "LEFT JOIN TRDR r ON r.COMPANY = " + companyId + " AND r.TRDR = c.TRDR_RETAILER " +
                "LEFT JOIN CCCRETAILERSCLIENTS cl ON cl.COMPANY = " + companyId + " AND cl.TRDR_CLIENT = c.TRDR_CLIENT " +
                "WHERE c.TRDR_RETAILER = :1 AND c.TRDR_CLIENT = :2 " +
                "ORDER BY r.NAME, cl.NAME";

            ds = X.GETSQLDATASET(query, params.trdr_retailer, params.trdr_client);

        } else if (params && params.trdr_retailer) {
            // Filtru doar după retailer
            query = "SELECT c.CCCSFTP as id, c.CCCSFTP, c.TRDR_RETAILER, c.TRDR_CLIENT, c.URL, c.PORT, " +
                "c.USERNAME, c.PASSPHRASE, c.INITIALDIRIN, c.INITIALDIROUT, c.FINGERPRINT, c.PRIVATEKEY, " +
                "r.NAME as retailerName, cl.NAME as clientName " +
                "FROM CCCSFTP c " +
                "LEFT JOIN TRDR r ON r.COMPANY = " + companyId + " AND r.TRDR = c.TRDR_RETAILER " +
                "LEFT JOIN CCCRETAILERSCLIENTS cl ON cl.COMPANY = " + companyId + " AND cl.TRDR_CLIENT = c.TRDR_CLIENT " +
                "WHERE c.TRDR_RETAILER = :1 " +
                "ORDER BY r.NAME, cl.NAME";

            ds = X.GETSQLDATASET(query, params.trdr_retailer);

        } else if (params && params.trdr_client) {
            // Filtru doar după client
            query = "SELECT c.CCCSFTP as id, c.CCCSFTP, c.TRDR_RETAILER, c.TRDR_CLIENT, c.URL, c.PORT, " +
                "c.USERNAME, c.PASSPHRASE, c.INITIALDIRIN, c.INITIALDIROUT, c.FINGERPRINT, c.PRIVATEKEY, " +
                "r.NAME as retailerName, cl.NAME as clientName " +
                "FROM CCCSFTP c " +
                "LEFT JOIN TRDR r ON r.COMPANY = " + companyId + " AND r.TRDR = c.TRDR_RETAILER " +
                "LEFT JOIN CCCRETAILERSCLIENTS cl ON cl.COMPANY = " + companyId + " AND cl.TRDR_CLIENT = c.TRDR_CLIENT " +
                "WHERE c.TRDR_CLIENT = :1 " +
                "ORDER BY r.NAME, cl.NAME";

            ds = X.GETSQLDATASET(query, params.trdr_client);

        } else {
            // Fără filtre - toate înregistrările
            query = "SELECT c.CCCSFTP as id, c.CCCSFTP, c.TRDR_RETAILER, c.TRDR_CLIENT, c.URL, c.PORT, " +
                "c.USERNAME, c.PASSPHRASE, c.INITIALDIRIN, c.INITIALDIROUT, c.FINGERPRINT, c.PRIVATEKEY, " +
                "r.NAME as retailerName, cl.NAME as clientName " +
                "FROM CCCSFTP c " +
                "LEFT JOIN TRDR r ON r.COMPANY = " + companyId + " AND r.TRDR = c.TRDR_RETAILER " +
                "LEFT JOIN CCCRETAILERSCLIENTS cl ON cl.COMPANY = " + companyId + " AND cl.TRDR_CLIENT = c.TRDR_CLIENT " +
                "ORDER BY r.NAME, cl.NAME";

            ds = X.GETSQLDATASET(query);
        }

        // Convert dataset to JSON for response
        var result = [];
        ds.FIRST;
        while (!ds.EOF) {
            // Create connector object
            var connector = {
                id: ds.id,
                cccsftp: ds.CCCSFTP,
                trdr_retailer: ds.TRDR_RETAILER,
                trdr_client: ds.TRDR_CLIENT,
                url: ds.URL,
                port: ds.PORT,
                username: ds.USERNAME,
                passphrase: ds.PASSPHRASE,
                initialdirin: ds.INITIALDIRIN,
                initialdirout: ds.INITIALDIROUT,
                fingerprint: ds.FINGERPRINT,
                privatekey: ds.PRIVATEKEY,
                retailerName: ds.retailerName,
                clientName: ds.clientName
            };

            // Add to result array
            result.push(connector);
            ds.NEXT;
        }

        return {
            success: true,
            data: result,
            total: result.length
        };
    } catch (e) {
        return {
            success: false,
            message: "Error retrieving EDI connectors: " + e.message
        };
    }
}

/**
 * Gets a single EDI connector by ID
 * @param {Object} params Object with id property
 * @returns {Object} Single EDI connector with success/error information
 */
function getEdiConnector(params) {
    try {
        var id = params.id;
        var companyId = X.SYS.COMPANY;

        // Validate ID
        if (!id) {
            return {
                success: false,
                message: "Connector ID is required"
            };
        }

        // Query connector by ID
        var query = "SELECT c.CCCSFTP as id, c.CCCSFTP, c.TRDR_RETAILER, c.TRDR_CLIENT, c.URL, c.PORT, " +
            "c.USERNAME, c.PASSPHRASE, c.INITIALDIRIN, c.INITIALDIROUT, c.FINGERPRINT, c.PRIVATEKEY, " +
            "r.NAME as retailerName, cl.NAME as clientName " +
            "FROM CCCSFTP c " +
            "LEFT JOIN TRDR r ON r.COMPANY = " + companyId + " AND r.TRDR = c.TRDR_RETAILER " +
            "LEFT JOIN CCCRETAILERSCLIENTS cl ON cl.COMPANY = " + companyId + " AND cl.TRDR_CLIENT = c.TRDR_CLIENT " +
            "WHERE c.CCCSFTP = :1";

        var ds = X.GETSQLDATASET(query, id);

        // Check if connector exists
        if (ds.EOF) {
            return {
                success: false,
                message: "Connector with ID " + id + " not found"
            };
        }

        // Create connector object
        var connector = {
            id: ds.id,
            cccsftp: ds.CCCSFTP,
            trdr_retailer: ds.TRDR_RETAILER,
            trdr_client: ds.TRDR_CLIENT,
            url: ds.URL,
            port: ds.PORT,
            username: ds.USERNAME,
            passphrase: ds.PASSPHRASE,
            initialdirin: ds.INITIALDIRIN,
            initialdirout: ds.INITIALDIROUT,
            fingerprint: ds.FINGERPRINT,
            privatekey: ds.PRIVATEKEY,
            retailerName: ds.retailerName,
            clientName: ds.clientName
        };

        return {
            success: true,
            data: connector
        };
    } catch (e) {
        return {
            success: false,
            message: "Error retrieving EDI connector: " + e.message
        };
    }
}

/**
 * Checks if an EDI connector already exists for a retailer/client combination
 * @param {Object} params Object with TRDR_RETAILER and TRDR_CLIENT properties
 * @returns {Object} Object with exists flag and success/error information
 */
function checkEdiConnectorExists(params) {
    try {
        var retailerId = params.TRDR_RETAILER;
        var clientId = params.TRDR_CLIENT;

        // Validate input
        if (!retailerId || !clientId) {
            return {
                success: false,
                message: "Retailer ID and Client ID are required"
            };
        }

        // Query for existing connector
        var query = "SELECT COUNT(*) as cnt FROM CCCSFTP " +
            "WHERE TRDR_RETAILER = :1 AND TRDR_CLIENT = :2";

        var count = X.SQL(query, retailerId, clientId);

        // Parse string result to number
        var exists = parseInt(count) > 0;

        return {
            success: true,
            exists: exists
        };
    } catch (e) {
        return {
            success: false,
            message: "Error checking if EDI connector exists: " + e.message
        };
    }
}

/**
 * Creates a new EDI connector
 * @param {Object} params Connector data
 * @returns {Object} Result with success/error information and new connector ID
 */
function createEdiConnector(params) {
    try {
        // Validate required fields
        if (!params.TRDR_RETAILER) {
            return { success: false, message: "TRDR_RETAILER is required" };
        }

        if (!params.TRDR_CLIENT) {
            return { success: false, message: "TRDR_CLIENT is required" };
        }

        if (!params.URL) {
            return { success: false, message: "URL is required" };
        }

        //EDIPROVIDER
        if (!params.EDIPROVIDER) {
            return { success: false, message: "EDIPROVIDER is required" };
        }

        //username
        if (!params.USERNAME) {
            return { success: false, message: "USERNAME is required" };
        }

        //passphrase
        if (!params.PASSPHRASE) {
            return { success: false, message: "PASSPHRASE is required" };
        }

        // Check if connector already exists
        var existsCheck = checkEdiConnectorExists({
            TRDR_RETAILER: params.TRDR_RETAILER,
            TRDR_CLIENT: params.TRDR_CLIENT
        });

        if (existsCheck.exists) {
            return {
                success: false,
                message: "EDI Connector already exists for retailer " + params.TRDR_RETAILER +
                    " and client " + params.TRDR_CLIENT
            };
        }

        // Prepare insert statement
        var sqlInsert = "INSERT INTO CCCSFTP (TRDR_RETAILER, TRDR_CLIENT, URL, PORT, USERNAME, PASSPHRASE, " +
            "INITIALDIRIN, INITIALDIROUT, FINGERPRINT, PRIVATEKEY) " +
            "VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10); " +
            "SELECT SCOPE_IDENTITY() AS new_id;";

        // Execute insert
        var newId = X.SQL(sqlInsert,
            params.TRDR_RETAILER,
            params.TRDR_CLIENT,
            params.URL,
            params.PORT || null,
            params.USERNAME || '',
            params.PASSPHRASE || '',
            params.INITIALDIRIN || '',
            params.INITIALDIROUT || '',
            params.FINGERPRINT || null,
            params.PRIVATEKEY || null
        );

        // Return success with new ID
        return {
            success: true,
            message: "EDI Connector created successfully",
            id: parseInt(newId)
        };
    } catch (e) {
        return {
            success: false,
            message: "Error creating EDI connector: " + e.message
        };
    }
}

/**
 * Updates an existing EDI connector
 * @param {Object} params Connector data with CCCSFTP (id)
 * @returns {Object} Result with success/error information
 */
function updateEdiConnector(params) {
    try {
        // Validate ID
        if (!params.CCCSFTP) {
            return { success: false, message: "Connector ID is required" };
        }

        // Check if connector exists
        var query = "SELECT COUNT(*) as cnt FROM CCCSFTP WHERE CCCSFTP = :1";
        var count = X.SQL(query, params.CCCSFTP);

        if (parseInt(count) === 0) {
            return {
                success: false,
                message: "Connector with ID " + params.CCCSFTP + " not found"
            };
        }

        // Build update statement with only defined fields
        var updateFields = [];
        var updateSql = "UPDATE CCCSFTP SET ";

        // URL
        if (params.URL !== undefined) {
            updateSql += "URL = :2";
            updateFields.push(params.URL);
            updateSql += ", ";
        }

        // PORT
        if (params.PORT !== undefined) {
            updateSql += "PORT = :" + (updateFields.length + 2);
            updateFields.push(params.PORT);
            updateSql += ", ";
        }

        // USERNAME
        if (params.USERNAME !== undefined) {
            updateSql += "USERNAME = :" + (updateFields.length + 2);
            updateFields.push(params.USERNAME);
            updateSql += ", ";
        }

        // PASSPHRASE
        if (params.PASSPHRASE !== undefined) {
            updateSql += "PASSPHRASE = :" + (updateFields.length + 2);
            updateFields.push(params.PASSPHRASE);
            updateSql += ", ";
        }

        // INITIALDIRIN
        if (params.INITIALDIRIN !== undefined) {
            updateSql += "INITIALDIRIN = :" + (updateFields.length + 2);
            updateFields.push(params.INITIALDIRIN);
            updateSql += ", ";
        }

        // INITIALDIROUT
        if (params.INITIALDIROUT !== undefined) {
            updateSql += "INITIALDIROUT = :" + (updateFields.length + 2);
            updateFields.push(params.INITIALDIROUT);
            updateSql += ", ";
        }

        // FINGERPRINT
        if (params.FINGERPRINT !== undefined) {
            updateSql += "FINGERPRINT = :" + (updateFields.length + 2);
            updateFields.push(params.FINGERPRINT);
            updateSql += ", ";
        }

        // PRIVATEKEY
        if (params.PRIVATEKEY !== undefined) {
            updateSql += "PRIVATEKEY = :" + (updateFields.length + 2);
            updateFields.push(params.PRIVATEKEY);
            updateSql += ", ";
        }

        // If no fields to update, return success
        if (updateFields.length === 0) {
            return {
                success: true,
                message: "No fields to update"
            };
        }

        // Remove trailing comma and space
        updateSql = updateSql.slice(0, -2);

        // Add WHERE clause
        updateSql += " WHERE CCCSFTP = :1";

        // Execute update with individual parameters
        switch (updateFields.length) {
            case 1:
                X.RUNSQL(updateSql, params.CCCSFTP, updateFields[0]);
                break;
            case 2:
                X.RUNSQL(updateSql, params.CCCSFTP, updateFields[0], updateFields[1]);
                break;
            case 3:
                X.RUNSQL(updateSql, params.CCCSFTP, updateFields[0], updateFields[1], updateFields[2]);
                break;
            case 4:
                X.RUNSQL(updateSql, params.CCCSFTP, updateFields[0], updateFields[1], updateFields[2], updateFields[3]);
                break;
            case 5:
                X.RUNSQL(updateSql, params.CCCSFTP, updateFields[0], updateFields[1], updateFields[2], updateFields[3], updateFields[4]);
                break;
            case 6:
                X.RUNSQL(updateSql, params.CCCSFTP, updateFields[0], updateFields[1], updateFields[2], updateFields[3], updateFields[4], updateFields[5]);
                break;
            case 7:
                X.RUNSQL(updateSql, params.CCCSFTP, updateFields[0], updateFields[1], updateFields[2], updateFields[3], updateFields[4], updateFields[5], updateFields[6]);
                break;
            case 8:
                X.RUNSQL(updateSql, params.CCCSFTP, updateFields[0], updateFields[1], updateFields[2], updateFields[3], updateFields[4], updateFields[5], updateFields[6], updateFields[7]);
                break;
        }

        return {
            success: true,
            message: "EDI Connector updated successfully"
        };
    } catch (e) {
        return {
            success: false,
            message: "Error updating EDI connector: " + e.message
        };
    }
}

/**
 * Deletes an EDI connector
 * @param {Object} params Object with id property
 * @returns {Object} Result with success/error information
 */
function deleteEdiConnector(params) {
    try {
        var id = params.id;

        // Validate ID
        if (!id) {
            return { success: false, message: "Connector ID is required" };
        }

        // Check if connector exists
        var query = "SELECT COUNT(*) as cnt FROM CCCSFTP WHERE CCCSFTP = :1";
        var count = X.SQL(query, id);

        if (parseInt(count) === 0) {
            return {
                success: false,
                message: "Connector with ID " + id + " not found"
            };
        }

        // Delete the connector
        var sqlDelete = "DELETE FROM CCCSFTP WHERE CCCSFTP = :1";
        X.RUNSQL(sqlDelete, id);

        return {
            success: true,
            message: "EDI Connector deleted successfully"
        };
    } catch (e) {
        return {
            success: false,
            message: "Error deleting EDI connector: " + e.message
        };
    }
}

/**
 * Stores a document in the system with routing based on GLN
 * @param {Object} params Document data with xmlContent, filename, provider, gln
 * @returns {Object} Result with success/error information
 */
function storeDocumentWithRouting(params) {
    try {
        var xmlContent = params.xmlContent;
        var filename = params.filename;
        var provider = params.provider;
        var gln = params.gln;

        // Validate required fields
        if (!xmlContent) {
            return { success: false, message: "XML content is required" };
        }

        if (!filename) {
            return { success: false, message: "Filename is required" };
        }

        if (!provider) {
            return { success: false, message: "Provider is required" };
        }

        if (!gln) {
            return { success: false, message: "GLN is required" };
        }

        // Find retailer and client based on GLN
        var glnQuery = "SELECT TRDR_RETAILER, TRDR_CLIENT FROM CCCEDIGLNMAPPINGS WHERE GLN = :1 AND ACTIVE = 1";
        var glnDs = X.GETSQLDATASET(glnQuery, gln);

        if (glnDs.EOF) {
            return {
                success: false,
                message: "No active retailer mapping found for GLN: " + gln
            };
        }

        var retailerId = glnDs.TRDR_RETAILER;
        var clientId = glnDs.TRDR_CLIENT;

        // Store document in CCCEDIRAWDOCUMENTS table
        var documentInsert = "INSERT INTO CCCEDIRAWDOCUMENTS (FILENAME, PROVIDER, RETAILER_ID, CLIENT_ID, " +
            "CONTENT, CONTENT_TYPE, DOCUMENT_TYPE, PROCESS_STATUS) " +
            "VALUES (:1, :2, :3, :4, :5, 'XML', 'ORDER', 'NEW'); " +
            "SELECT SCOPE_IDENTITY() AS new_id;";

        var documentId = X.SQL(documentInsert,
            filename,
            provider,
            retailerId,
            clientId,
            xmlContent
        );

        // Check routing settings
        var routingQuery = "SELECT PROCESS_IN_LEGACY FROM CCCEDIRETAILERROUTING WHERE TRDR_RETAILER = :1 AND ACTIVE = 1";
        var routingDs = X.GETSQLDATASET(routingQuery, retailerId);

        var processInLegacy = true;
        if (!routingDs.EOF) {
            processInLegacy = routingDs.PROCESS_IN_LEGACY? true : false;
        }

        // Update document with routing decision
        var routingUpdate = "UPDATE CCCEDIRAWDOCUMENTS SET LEGACY_PROCESSING = :1 WHERE CCCEDIRAWDOCUMENTS = :2";
        X.RUNSQL(routingUpdate, processInLegacy ? 1 : 0, documentId);

        // Add entry to process monitor
        var monitorInsert = "INSERT INTO CCCEDIPROCESSMONITOR (DOCUMENT_ID, PROCESS_STEP, STEP_STATUS, MESSAGE, CREATED_BY) " +
            "VALUES (:1, 'RECEIVED', 'SUCCESS', 'Document received and routed successfully', 'API')";
        X.RUNSQL(monitorInsert, documentId);

        return {
            success: true,
            message: "Document stored successfully",
            documentId: parseInt(documentId),
            retailerId: retailerId,
            clientId: clientId,
            processInLegacy: processInLegacy
        };
    } catch (e) {
        return {
            success: false,
            message: "Error storing document: " + e.message
        };
    }
}

/**
 * Gets all retailer‐clients (multi-tenant). 
 * Currently only returns TRDR_CLIENT=1.
 * @param {Object} params Optional filters (ignored for now)
 * @returns {Object} List of active clients
 */
function getRetailersClients(params) {
    try {
        var companyId = X.SYS.COMPANY;
        var query =
            "SELECT TRDR_CLIENT as id, NAME, WSURL, WSUSER, WSPASS, COMPANY, BRANCH, ACTIVE, APPID " +
            "FROM CCCRETAILERSCLIENTS " +
            "WHERE COMPANY = " + companyId +
            " ORDER BY NAME";
        var ds = X.GETSQLDATASET(query);
        var result = [];
        ds.FIRST;
        while (!ds.EOF) {
            // Get connection statistics for this client
            var statsQuery = "SELECT " +
                "COUNT(DISTINCT TRDR_RETAILER) as retailer_count, " +
                "COUNT(*) as connection_count, " +
                "COUNT(DISTINCT EDIPROVIDER) as provider_count " +
                "FROM CCCSFTP WHERE TRDR_CLIENT = :1";
            var statsDs = X.GETSQLDATASET(statsQuery, ds.id);
            
            result.push({
                id: ds.id,
                name: ds.NAME,
                wsurl: ds.WSURL,
                wsuser: ds.WSUSER,
                wspass: ds.WSPASS ? '[CONFIGURED]' : null, // Don't expose actual password
                company: ds.COMPANY,
                branch: ds.BRANCH,
                active: ds.ACTIVE === 1,
                appid: ds.APPID,
                statistics: {
                    retailer_count: statsDs.EOF ? 0 : (statsDs.retailer_count || 0),
                    connection_count: statsDs.EOF ? 0 : (statsDs.connection_count || 0),
                    provider_count: statsDs.EOF ? 0 : (statsDs.provider_count || 0)
                }
            });
            ds.NEXT;
        }
        return { success: true, data: result, total: result.length };
    } catch (e) {
        return {
            success: false,
            message: "Error retrieving retailer clients: " + e.message
        };
    }
}

/**
 * Gets a single retailer‐client by ID
 * @param {Object} params Object with id property
 * @returns {Object} Single client or error
 */
function getRetailersClient(params) {
    try {
        var id = params.id;
        var companyId = X.SYS.COMPANY;
        if (!id) {
            return { success: false, message: "Client ID is required" };
        }
        var query =
            "SELECT TRDR_CLIENT as id, NAME, WSURL, WSUSER, WSPASS, COMPANY, BRANCH, ACTIVE, APPID " +
            "FROM CCCRETAILERSCLIENTS " +
            "WHERE COMPANY = " + companyId +
            " AND TRDR_CLIENT = :1";
        var ds = X.GETSQLDATASET(query, id);
        if (ds.EOF) {
            return {
                success: false,
                message: "Client not found: " + id
            };
        }
        
        // Get connection statistics for this client
        var statsQuery = "SELECT " +
            "COUNT(DISTINCT TRDR_RETAILER) as retailer_count, " +
            "COUNT(*) as connection_count, " +
            "COUNT(DISTINCT EDIPROVIDER) as provider_count " +
            "FROM CCCSFTP WHERE TRDR_CLIENT = :1";
        var statsDs = X.GETSQLDATASET(statsQuery, id);
        
        // Get connected retailers list
        var retailersQuery = "SELECT DISTINCT " +
            "s.TRDR_RETAILER, " +
            "r.NAME as retailer_name, " +
            "r.CODE as retailer_code " +
            "FROM CCCSFTP s " +
            "LEFT JOIN TRDR r ON r.COMPANY = " + companyId + " AND r.TRDR = s.TRDR_RETAILER " +
            "WHERE s.TRDR_CLIENT = :1";
        var retailersDs = X.GETSQLDATASET(retailersQuery, id);
        var retailers = [];
        retailersDs.FIRST;
        while (!retailersDs.EOF) {
            retailers.push({
                trdr_retailer: retailersDs.TRDR_RETAILER,
                retailer_name: retailersDs.retailer_name,
                retailer_code: retailersDs.retailer_code
            });
            retailersDs.NEXT;
        }
        
        var client = {
            id: ds.id,
            name: ds.NAME,
            wsurl: ds.WSURL,
            wsuser: ds.WSUSER,
            wspass: ds.WSPASS ? '[CONFIGURED]' : null, // Don't expose actual password
            company: ds.COMPANY,
            branch: ds.BRANCH,
            active: ds.ACTIVE === 1,
            appid: ds.APPID,
            statistics: {
                retailer_count: statsDs.EOF ? 0 : (statsDs.retailer_count || 0),
                connection_count: statsDs.EOF ? 0 : (statsDs.connection_count || 0),
                provider_count: statsDs.EOF ? 0 : (statsDs.provider_count || 0)
            },
            connected_retailers: retailers
        };        return { success: true, data: client };
    } catch (e) {
        return {
            success: false,
            message: "Error retrieving retailer client: " + e.message
        };
    }
}

/**
 * Gets all connections (client-provider-retailer combinations) with full details
 * This returns the operational connections, not the EDI providers themselves
 * @param {Object} params Optional filters (ignored for now)
 * @returns {Object} List of connections with provider, retailer, and connection details
 */
function getConnections(params) {
    try {
        var query = "SELECT " +
            "a.CCCSFTP as id, " +
            "a.TRDR_RETAILER, " +
            "a.TRDR_CLIENT, " +
            "a.URL, " +
            "a.PORT, " +
            "a.USERNAME, " +
            "a.PASSPHRASE, " +
            "a.INITIALDIRIN, " +
            "a.INITIALDIROUT, " +
            "a.FINGERPRINT, " +
            "a.PRIVATEKEY, " +
            "b.CCCEDIPROVIDER as provider_id, " +
            "b.NAME as provider_name, " +
            "b.CONNTYPE as conntype_id, " +
            "c.NAME as conntype_name, " +
            "r.NAME as retailer_name, " +
            "r.CODE as retailer_code, " +
            "r.AFM as retailer_tax_id, " +
            "cl.NAME as client_name, " +
            "cl.WSURL as client_ws_url, " +
            "cl.ACTIVE as client_active, " +
            "cl.APPID as client_appid " +
            "FROM CCCSFTP a " +
            "INNER JOIN CCCEDIPROVIDER b ON a.EDIPROVIDER = b.CCCEDIPROVIDER " +
            "INNER JOIN CCCCONNTYPE c ON c.CCCCONNTYPE = b.CONNTYPE " +
            "LEFT JOIN TRDR r ON r.COMPANY = " + X.SYS.COMPANY + " AND r.TRDR = a.TRDR_RETAILER " +
            "LEFT JOIN CCCRETAILERSCLIENTS cl ON cl.TRDR_CLIENT = a.TRDR_CLIENT " +
            "ORDER BY cl.NAME, b.NAME, r.NAME";
        
        var ds = X.GETSQLDATASET(query);
        var result = [];
        ds.FIRST;
        while (!ds.EOF) {
            result.push({
                id: ds.id,
                trdr_retailer: ds.TRDR_RETAILER,
                trdr_client: ds.TRDR_CLIENT,
                
                // Retailer information
                retailer: {
                    id: ds.TRDR_RETAILER,
                    name: ds.retailer_name || 'Unknown Retailer',
                    code: ds.retailer_code || '',
                    tax_id: ds.retailer_tax_id || ''
                },
                
                // Client information
                client: {
                    id: ds.TRDR_CLIENT,
                    name: ds.client_name || 'Unknown Client',
                    ws_url: ds.client_ws_url,
                    active: ds.client_active === 1,
                    appid: ds.client_appid
                },
                
                // Provider information
                provider: {
                    id: ds.provider_id,
                    name: ds.provider_name,
                    conntype_id: ds.conntype_id,
                    conntype_name: ds.conntype_name
                },
                
                // Connection technical details
                connection_details: {
                    url: ds.URL,
                    port: ds.PORT,
                    username: ds.USERNAME,
                    passphrase: ds.PASSPHRASE ? '[CONFIGURED]' : null,
                    initial_dir_in: ds.INITIALDIRIN,
                    initial_dir_out: ds.INITIALDIROUT,
                    fingerprint: ds.FINGERPRINT,
                    private_key: ds.PRIVATEKEY ? '[CONFIGURED]' : null
                },
                
                // Computed fields for matrix view
                connection_name: (ds.client_name || 'Unknown') + ' → ' + (ds.provider_name || 'Unknown') + ' → ' + (ds.retailer_name || 'Unknown'),
                status: ds.client_active === 1 ? 'Active' : 'Inactive',
                connection_type: ds.conntype_name
            });
            ds.NEXT;
        }
        return { success: true, data: result, total: result.length };
    } catch (e) {
        return { success: false, message: "Error retrieving connections: " + e.message };
    }
}

/**
 * Gets all actual EDI providers with aggregated statistics
 * Returns the provider companies themselves, not individual connections
 * @param {Object} params Optional filter parameters
 * @returns {Object} List of EDI providers with statistics
 */
function getEdiProviders(params) {
    try {        // Get unique providers with their basic info and connection type
        var providerQuery = "SELECT " +
            "ep.CCCEDIPROVIDER as id, " +
            "ep.NAME as provider_name, " +
            "ep.CONNTYPE as conntype_id, " +
            "ct.NAME as conntype_name " +
            "FROM CCCEDIPROVIDER ep " +
            "LEFT JOIN CCCCONNTYPE ct ON ep.CONNTYPE = ct.CCCCONNTYPE " +
            "ORDER BY ep.NAME";
        
        var providerDs = X.GETSQLDATASET(providerQuery);
        var providers = [];
        
        providerDs.FIRST;
        while (!providerDs.EOF) {
            var providerId = providerDs.id;
            
            // Get statistics for this provider
            var statsQuery = "SELECT " +
                "COUNT(DISTINCT a.TRDR_CLIENT) as client_count, " +
                "COUNT(DISTINCT a.TRDR_RETAILER) as retailer_count, " +
                "COUNT(*) as connection_count, " +
                "SUM(CASE WHEN cl.ACTIVE = 1 THEN 1 ELSE 0 END) as active_connections " +
                "FROM CCCSFTP a " +
                "LEFT JOIN CCCRETAILERSCLIENTS cl ON cl.TRDR_CLIENT = a.TRDR_CLIENT " +
                "WHERE a.EDIPROVIDER = :1";
            
            var statsDs = X.GETSQLDATASET(statsQuery, providerId);
            
            // Get sample connection details (from first connection)
            var sampleQuery = "SELECT TOP 1 " +
                "a.URL, a.PORT, a.USERNAME, " +
                "cl.WSURL as client_ws_url " +
                "FROM CCCSFTP a " +
                "LEFT JOIN CCCRETAILERSCLIENTS cl ON cl.TRDR_CLIENT = a.TRDR_CLIENT " +
                "WHERE a.EDIPROVIDER = :1";
            
            var sampleDs = X.GETSQLDATASET(sampleQuery, providerId);            var provider = {
                id: providerId,
                provider_name: providerDs.provider_name,
                conntype_id: providerDs.conntype_id,
                conntype_name: providerDs.conntype_name,
                
                // Statistics
                statistics: {
                    client_count: statsDs.EOF ? 0 : (statsDs.client_count || 0),
                    retailer_count: statsDs.EOF ? 0 : (statsDs.retailer_count || 0),
                    connection_count: statsDs.EOF ? 0 : (statsDs.connection_count || 0),
                    active_connections: statsDs.EOF ? 0 : (statsDs.active_connections || 0)
                },
                
                // Sample connection details (for display purposes)
                sample_connection: sampleDs.EOF ? null : {
                    url: sampleDs.URL,
                    port: sampleDs.PORT,
                    username: sampleDs.USERNAME,
                    client_ws_url: sampleDs.client_ws_url
                },
                
                // Computed properties
                status: (statsDs.EOF ? 0 : (statsDs.active_connections || 0)) > 0 ? 'Active' : 'Inactive',
                connection_status: !statsDs.EOF && statsDs.connection_count > 0
            };
            
            providers.push(provider);
            providerDs.NEXT;
        }
        
        return { success: true, data: providers, total: providers.length };
    } catch (e) {
        return { success: false, message: "Error retrieving EDI providers: " + e.message };
    }
}

/**
 * Gets a single connection by ID (CCCSFTP.CCCSFTP)
 * This was previously called getEdiProvider but actually returns a connection
 * @param {Object} params Object with id property
 * @returns {Object} Single connection with full details or error
 */
function getConnection(params) {
    try {
        var id = params.id;
        if (!id) {
            return { success: false, message: "Provider ID is required" };
        }
        
        var query = "SELECT " +
            "a.CCCSFTP as id, " +
            "a.TRDR_RETAILER, " +
            "a.TRDR_CLIENT, " +
            "a.URL, " +
            "a.PORT, " +
            "a.USERNAME, " +
            "a.PASSPHRASE, " +
            "a.INITIALDIRIN, " +
            "a.INITIALDIROUT, " +
            "a.FINGERPRINT, " +
            "a.PRIVATEKEY, " +
            "b.CCCEDIPROVIDER as provider_id, " +
            "b.NAME as provider_name, " +
            "b.CONNTYPE as conntype_id, " +
            "c.NAME as conntype_name, " +
            "r.NAME as retailer_name, " +
            "r.CODE as retailer_code, " +
            "r.AFM as retailer_tax_id, " +
            "cl.WSURL as client_ws_url, " +
            "cl.WSUSER as client_ws_user, " +
            "cl.COMPANY as client_company, " +
            "cl.BRANCH as client_branch, " +
            "cl.ACTIVE as client_active " +
            "FROM CCCSFTP a " +
            "INNER JOIN CCCEDIPROVIDER b ON a.EDIPROVIDER = b.CCCEDIPROVIDER " +
            "INNER JOIN CCCCONNTYPE c ON c.CCCCONNTYPE = b.CONNTYPE " +
            "LEFT JOIN TRDR r ON r.COMPANY = " + X.SYS.COMPANY + " AND r.TRDR = a.TRDR_RETAILER " +
            "LEFT JOIN CCCRETAILERSCLIENTS cl ON cl.TRDR_CLIENT = a.TRDR_CLIENT " +
            "WHERE a.CCCSFTP = :1";
            
        var ds = X.GETSQLDATASET(query, id);
        if (ds.EOF) {
            return { success: false, message: "Provider not found: " + id };
        }
        
        var provider = {
            id: ds.id,
            trdr_retailer: ds.TRDR_RETAILER,
            trdr_client: ds.TRDR_CLIENT,
            retailer: {
                name: ds.retailer_name || 'Unknown',
                code: ds.retailer_code || '',
                tax_id: ds.retailer_tax_id || ''
            },
            provider_id: ds.provider_id,
            provider_name: ds.provider_name,
            conntype_id: ds.conntype_id,
            conntype_name: ds.conntype_name,
            connection_details: {
                url: ds.URL,
                port: ds.PORT,
                username: ds.USERNAME,
                passphrase: ds.PASSPHRASE, // Be careful with sensitive data
                initial_dir_in: ds.INITIALDIRIN,
                initial_dir_out: ds.INITIALDIROUT,
                fingerprint: ds.FINGERPRINT,
                private_key: ds.PRIVATEKEY ? '[CONFIGURED]' : null // Don't expose actual key
            },
            client: {
                ws_url: ds.client_ws_url,
                ws_user: ds.client_ws_user,
                company: ds.client_company,
                branch: ds.client_branch,                active: ds.client_active ? true : false
            }
        };
        return { success: true, data: provider };
    } catch (e) {
        return { success: false, message: "Error retrieving connection: " + e.message };
    }
}

/**
 * Gets a single EDI provider by ID with full details and statistics
 * @param {Object} params Object with id property (CCCEDIPROVIDER.CCCEDIPROVIDER)
 * @returns {Object} Single EDI provider with details, statistics, and connections
 */
function getEdiProvider(params) {
    try {
        var id = params.id;
        if (!id) {
            return { success: false, message: "Provider ID is required" };
        }
          // Get provider details
        var providerQuery = "SELECT " +
            "ep.CCCEDIPROVIDER as id, " +
            "ep.NAME as provider_name, " +
            "ep.CONNTYPE as conntype_id, " +
            "ct.NAME as conntype_name " +
            "FROM CCCEDIPROVIDER ep " +
            "LEFT JOIN CCCCONNTYPE ct ON ep.CONNTYPE = ct.CCCCONNTYPE " +
            "WHERE ep.CCCEDIPROVIDER = :1";
        
        var providerDs = X.GETSQLDATASET(providerQuery, id);
        if (providerDs.EOF) {
            return { success: false, message: "EDI provider not found: " + id };
        }
        
        // Get detailed statistics
        var statsQuery = "SELECT " +
            "COUNT(DISTINCT a.TRDR_CLIENT) as client_count, " +
            "COUNT(DISTINCT a.TRDR_RETAILER) as retailer_count, " +
            "COUNT(*) as connection_count, " +
            "SUM(CASE WHEN cl.ACTIVE = 1 THEN 1 ELSE 0 END) as active_connections " +
            "FROM CCCSFTP a " +
            "LEFT JOIN CCCRETAILERSCLIENTS cl ON cl.TRDR_CLIENT = a.TRDR_CLIENT " +
            "WHERE a.EDIPROVIDER = :1";
        
        var statsDs = X.GETSQLDATASET(statsQuery, id);
        
        // Get connected clients
        var clientsQuery = "SELECT DISTINCT " +
            "cl.TRDR_CLIENT as client_id, " +
            "cl.NAME as client_name, " +
            "cl.WSURL as client_ws_url, " +
            "cl.ACTIVE as client_active " +
            "FROM CCCSFTP a " +
            "LEFT JOIN CCCRETAILERSCLIENTS cl ON cl.TRDR_CLIENT = a.TRDR_CLIENT " +
            "WHERE a.EDIPROVIDER = :1";
        
        var clientsDs = X.GETSQLDATASET(clientsQuery, id);
        var clients = [];
        clientsDs.FIRST;
        while (!clientsDs.EOF) {
            clients.push({
                client_id: clientsDs.client_id,
                client_name: clientsDs.client_name,
                client_ws_url: clientsDs.client_ws_url,
                client_active: clientsDs.client_active === 1
            });
            clientsDs.NEXT;
        }
        
        // Get connected retailers
        var retailersQuery = "SELECT DISTINCT " +
            "a.TRDR_RETAILER, " +
            "r.NAME as retailer_name, " +
            "r.CODE as retailer_code, " +
            "r.AFM as retailer_tax_id " +
            "FROM CCCSFTP a " +
            "LEFT JOIN TRDR r ON r.COMPANY = " + X.SYS.COMPANY + " AND r.TRDR = a.TRDR_RETAILER " +
            "WHERE a.EDIPROVIDER = :1";
        
        var retailersDs = X.GETSQLDATASET(retailersQuery, id);
        var retailers = [];
        retailersDs.FIRST;
        while (!retailersDs.EOF) {
            retailers.push({
                trdr_retailer: retailersDs.TRDR_RETAILER,
                retailer_name: retailersDs.retailer_name,
                retailer_code: retailersDs.retailer_code,
                retailer_tax_id: retailersDs.retailer_tax_id
            });
            retailersDs.NEXT;
        }        var provider = {
            id: providerDs.id,
            provider_name: providerDs.provider_name,
            conntype_id: providerDs.conntype_id,
            conntype_name: providerDs.conntype_name,
            
            // Statistics
            statistics: {
                client_count: statsDs.EOF ? 0 : (statsDs.client_count || 0),
                retailer_count: statsDs.EOF ? 0 : (statsDs.retailer_count || 0),
                connection_count: statsDs.EOF ? 0 : (statsDs.connection_count || 0),
                active_connections: statsDs.EOF ? 0 : (statsDs.active_connections || 0)
            },
            
            // Connected entities
            connected_clients: clients,
            connected_retailers: retailers,
            
            // Computed properties
            status: (statsDs.EOF ? 0 : (statsDs.active_connections || 0)) > 0 ? 'Active' : 'Inactive'
        };
        
        return { success: true, data: provider };
    } catch (e) {
        return { success: false, message: "Error retrieving EDI provider: " + e.message };
    }
}

/**
 * Gets all connection types
 * @param {Object} params Optional filters (ignored)
 * @returns {Object} List of connection types
 */
function getConnTypes(params) {
    try {
        var query = "SELECT CCCCONNTYPE as id, NAME FROM CCCCONNTYPE ORDER BY NAME";
        var ds = X.GETSQLDATASET(query);
        var result = [];
        ds.FIRST;
        while (!ds.EOF) {
            result.push({ id: ds.id, name: ds.NAME });
            ds.NEXT;
        }
        return { success: true, data: result, total: result.length };
    } catch (e) {
        return { success: false, message: "Error retrieving connection types: " + e.message };
    }
}

/**
 * Gets a single connection type by ID
 * @param {Object} params Object with id property
 * @returns {Object} Single connection type or error
 */
function getConnType(params) {
    try {
        var id = params.id;
        if (!id) {
            return { success: false, message: "Connection type ID is required" };
        }
        var query = "SELECT CCCCONNTYPE as id, NAME FROM CCCCONNTYPE WHERE CCCCONNTYPE = :1";        var ds = X.GETSQLDATASET(query, id);
        if (ds.EOF) {
            return { success: false, message: "Connection type not found: " + id };
        }
        return { success: true, data: { id: ds.id, name: ds.NAME } };
    } catch (e) {
        return { success: false, message: "Error retrieving connection type: " + e.message };
    }
}

/**
 * Creates a new EDI provider configuration
 * @param {Object} params Provider configuration object
 * @returns {Object} Created provider with ID or error
 */
function createEdiProvider(params) {
    try {
        // Input validation
        if (!params.provider_name || !params.conntype_id || !params.trdr_retailer || !params.trdr_client) {
            return { success: false, message: "Required fields: provider_name, conntype_id, trdr_retailer, trdr_client" };
        }

        // First, create/get the EDI provider entry
        var providerQuery = "SELECT CCCEDIPROVIDER FROM CCCEDIPROVIDER WHERE NAME = :1 AND CONNTYPE = :2";
        var providerDs = X.GETSQLDATASET(providerQuery, params.provider_name, params.conntype_id);
        
        var providerId;
        if (providerDs.EOF) {
            // Create new provider
            var insertProviderQuery = "INSERT INTO CCCEDIPROVIDER (NAME, CONNTYPE) VALUES (:1, :2)";
            X.RUNSQL(insertProviderQuery, params.provider_name, params.conntype_id);
            
            var newProviderQuery = "SELECT TOP 1 CCCEDIPROVIDER FROM CCCEDIPROVIDER WHERE NAME = :1 AND CONNTYPE = :2 ORDER BY CCCEDIPROVIDER DESC";
            var newProviderDs = X.GETSQLDATASET(newProviderQuery, params.provider_name, params.conntype_id);
            providerId = newProviderDs.CCCEDIPROVIDER;
        } else {
            providerId = providerDs.CCCEDIPROVIDER;
        }

        // Create SFTP connection configuration
        var sftpInsertQuery = "INSERT INTO CCCSFTP (" +
            "TRDR_RETAILER, TRDR_CLIENT, URL, PORT, USERNAME, PASSPHRASE, " +
            "INITIALDIRIN, INITIALDIROUT, FINGERPRINT, PRIVATEKEY, EDIPROVIDER" +
            ") VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11)";
            
        X.RUNSQL(sftpInsertQuery,
            params.trdr_retailer,
            params.trdr_client,
            params.url || '',
            params.port || 22,
            params.username || '',
            params.passphrase || '',
            params.initial_dir_in || '',
            params.initial_dir_out || '',
            params.fingerprint || '',
            params.private_key || '',
            providerId
        );        // Get the newly created record
        var newQuery = "SELECT TOP 1 CCCSFTP FROM CCCSFTP WHERE TRDR_RETAILER = :1 AND TRDR_CLIENT = :2 AND EDIPROVIDER = :3 ORDER BY CCCSFTP DESC";
        var newDs = X.GETSQLDATASET(newQuery, params.trdr_retailer, params.trdr_client, providerId);
        
        if (newDs.EOF) {
            return { success: false, message: "Failed to create EDI provider" };
        }

        return getConnection({ id: newDs.CCCSFTP });
        
    } catch (e) {
        return { success: false, message: "Error creating EDI provider: " + e.message };
    }
}

/**
 * Updates an existing EDI provider configuration
 * @param {Object} params Provider update object with id and fields to update
 * @returns {Object} Updated provider or error
 */
function updateEdiProvider(params) {
    try {
        var id = params.id;
        if (!id) {
            return { success: false, message: "Provider ID is required" };
        }

        // Check if exists
        var checkQuery = "SELECT CCCSFTP FROM CCCSFTP WHERE CCCSFTP = :1";
        var checkDs = X.GETSQLDATASET(checkQuery, id);
        if (checkDs.EOF) {
            return { success: false, message: "Provider not found: " + id };
        }

        // Build update query
        var updateParts = [];
        var values = [];
        
        if (params.url !== undefined) {
            updateParts.push("URL = :" + (values.length + 1));
            values.push(params.url);
        }
        if (params.port !== undefined) {
            updateParts.push("PORT = :" + (values.length + 1));
            values.push(params.port);
        }
        if (params.username !== undefined) {
            updateParts.push("USERNAME = :" + (values.length + 1));
            values.push(params.username);
        }
        if (params.passphrase !== undefined) {
            updateParts.push("PASSPHRASE = :" + (values.length + 1));
            values.push(params.passphrase);
        }
        if (params.initial_dir_in !== undefined) {
            updateParts.push("INITIALDIRIN = :" + (values.length + 1));
            values.push(params.initial_dir_in);
        }
        if (params.initial_dir_out !== undefined) {
            updateParts.push("INITIALDIROUT = :" + (values.length + 1));
            values.push(params.initial_dir_out);
        }

        if (updateParts.length === 0) {
            return { success: false, message: "No fields to update" };
        }        values.push(id);
        var updateQuery = "UPDATE CCCSFTP SET " + updateParts.join(", ") + " WHERE CCCSFTP = :" + values.length;
        
        // X.RUNSQL doesn't accept arrays, we need to call it with individual parameters
        switch (values.length) {
            case 2:
                X.RUNSQL(updateQuery, values[0], values[1]);
                break;
            case 3:
                X.RUNSQL(updateQuery, values[0], values[1], values[2]);
                break;
            case 4:
                X.RUNSQL(updateQuery, values[0], values[1], values[2], values[3]);
                break;
            case 5:
                X.RUNSQL(updateQuery, values[0], values[1], values[2], values[3], values[4]);
                break;
            case 6:
                X.RUNSQL(updateQuery, values[0], values[1], values[2], values[3], values[4], values[5]);
                break;
            case 7:
                X.RUNSQL(updateQuery, values[0], values[1], values[2], values[3], values[4], values[5], values[6]);
                break;
            default:
                return { success: false, message: "Too many fields to update" };
        }
        
        return getConnection({ id: id });
        
    } catch (e) {
        return { success: false, message: "Error updating EDI provider: " + e.message };
    }
}

/**
 * Deletes an EDI provider configuration
 * @param {Object} params Object with id property
 * @returns {Object} Success confirmation or error
 */
function deleteEdiProvider(params) {
    try {
        var id = params.id;
        if (!id) {
            return { success: false, message: "Provider ID is required" };
        }

        var checkQuery = "SELECT CCCSFTP FROM CCCSFTP WHERE CCCSFTP = :1";
        var checkDs = X.GETSQLDATASET(checkQuery, id);
        if (checkDs.EOF) {
            return { success: false, message: "Provider not found: " + id };
        }

        var deleteQuery = "DELETE FROM CCCSFTP WHERE CCCSFTP = :1";
        X.RUNSQL(deleteQuery, id);

        return { success: true, message: "EDI provider deleted successfully" };
        
    } catch (e) {
        return { success: false, message: "Error deleting EDI provider: " + e.message };
    }
}

/**
 * Gets all document-to-S1 mappings (optionally filtered by client for multi-tenant support)
 * @param {Object} params Optional object with trdr_client property for tenant filtering
 * @returns {Object} List of all document mappings with success/error information
 */
function getAllDocumentMappings(params) {
    try {
        var companyId = X.SYS.COMPANY;
        var query;
        var ds;

        // If client ID is provided, filter by client (for tenant isolation)
        if (params && params.trdr_client) {
            query = "SELECT m.CCCDOCUMENTES1MAPPINGS as id, m.TRDR_RETAILER, m.TRDR_CLIENT, " +
                "m.SOSOURCE, m.FPRMS, m.SERIES, m.INITIALDIRIN, m.INITIALDIROUT, " +
                "m.DOCUMENT_TYPE, m.DIRECTION, m.AUTO_PROCESS, m.ACTIVE, m.TEST_MODE, " +
                "m.XML_ROOT_PATH, m.HEADER_PATH, m.LINES_PATH, " +
                "m.CREATED_DATE, m.MODIFIED_DATE, m.CREATED_BY, " +
                "r.NAME as retailerName, c.NAME as clientName " +
                "FROM CCCDOCUMENTES1MAPPINGS m " +
                "LEFT JOIN TRDR r ON r.TRDR = m.TRDR_RETAILER AND r.COMPANY = " + companyId + " " +
                "LEFT JOIN CCCRETAILERSCLIENTS c ON c.TRDR_CLIENT = m.TRDR_CLIENT " +
                "WHERE m.TRDR_CLIENT = :1 " +
                "ORDER BY c.NAME, r.NAME, m.DOCUMENT_TYPE, m.DIRECTION";

            ds = X.GETSQLDATASET(query, params.trdr_client);
        } else {
            // Get all mappings (admin view)
            query = "SELECT m.CCCDOCUMENTES1MAPPINGS as id, m.TRDR_RETAILER, m.TRDR_CLIENT, " +
                "m.SOSOURCE, m.FPRMS, m.SERIES, m.INITIALDIRIN, m.INITIALDIROUT, " +
                "m.DOCUMENT_TYPE, m.DIRECTION, m.AUTO_PROCESS, m.ACTIVE, m.TEST_MODE, " +
                "m.XML_ROOT_PATH, m.HEADER_PATH, m.LINES_PATH, " +
                "m.CREATED_DATE, m.MODIFIED_DATE, m.CREATED_BY, " +
                "r.NAME as retailerName, c.NAME as clientName " +
                "FROM CCCDOCUMENTES1MAPPINGS m " +
                "LEFT JOIN TRDR r ON r.TRDR = m.TRDR_RETAILER AND r.COMPANY = " + companyId + " " +
                "LEFT JOIN CCCRETAILERSCLIENTS c ON c.TRDR_CLIENT = m.TRDR_CLIENT " +
                "ORDER BY c.NAME, r.NAME, m.DOCUMENT_TYPE, m.DIRECTION";

            ds = X.GETSQLDATASET(query, null);
        }

        // Convert dataset to result array
        var result = [];
        ds.FIRST;
        while (!ds.EOF) {
            result.push({
                id: ds.id,
                trdr_retailer: ds.TRDR_RETAILER,
                trdr_client: ds.TRDR_CLIENT,
                client_name: ds.clientName,
                retailer_name: ds.retailerName,
                sosource: ds.SOSOURCE,
                fprms: ds.FPRMS,
                series: ds.SERIES,
                initialdirin: ds.INITIALDIRIN,
                initialdirout: ds.INITIALDIROUT,
                document_type: ds.DOCUMENT_TYPE,
                direction: ds.DIRECTION,
                auto_process: ds.AUTO_PROCESS? true : false,
                // Convert boolean fields to true/false
                active: ds.ACTIVE? true : false,
                test_mode: ds.TEST_MODE? true : false,
                xml_root_path: ds.XML_ROOT_PATH,
                header_path: ds.HEADER_PATH,
                lines_path: ds.LINES_PATH,
                created_date: ds.CREATED_DATE,
                modified_date: ds.MODIFIED_DATE,
                created_by: ds.CREATED_BY
            });
            ds.NEXT;
        }

        return { success: true, data: result, count: result.length };

    } catch (e) {
        return { success: false, message: "Error retrieving document mappings: " + e.message };
    }
}

/**
 * Gets document-to-S1 mappings by retailer and client combination
 * @param {Object} params Object with trdr_retailer and trdr_client properties
 * @returns {Object} List of document mappings with success/error information
 */
function getDocumentMappingsByRetailerClient(params) {
    try {
        var retailerId = params.trdr_retailer;
        var clientId = params.trdr_client;
        var companyId = X.SYS.COMPANY;

        // Validate required parameters
        if (!retailerId) {
            return { success: false, message: "Retailer ID (trdr_retailer) is required", params: { trdr_client: params.trdr_client, trdr_retailer: params.trdr_retailer } };
        }

        if (!clientId) {
            return { success: false, message: "Client ID (trdr_client) is required", params: { trdr_client: params.trdr_client, trdr_retailer: params.trdr_retailer } };
        }

        // Build the query to get mappings by retailer and client
        var query = "SELECT m.CCCDOCUMENTES1MAPPINGS as id, m.TRDR_RETAILER, m.TRDR_CLIENT, " +
            "m.SOSOURCE, m.FPRMS, m.SERIES, m.INITIALDIRIN, m.INITIALDIROUT, " +
            "m.DOCUMENT_TYPE, m.DIRECTION, m.AUTO_PROCESS, m.ACTIVE, m.TEST_MODE, " +
            "m.XML_ROOT_PATH, m.HEADER_PATH, m.LINES_PATH, " +
            "m.CREATED_DATE, m.MODIFIED_DATE, m.CREATED_BY, " +
            "r.NAME as retailerName, c.NAME as clientName " +
            "FROM CCCDOCUMENTES1MAPPINGS m " +
            "LEFT JOIN TRDR r ON r.TRDR = m.TRDR_RETAILER AND r.COMPANY = " + companyId + " " +
            "LEFT JOIN CCCRETAILERSCLIENTS c ON c.TRDR_CLIENT = m.TRDR_CLIENT " +
            "WHERE m.TRDR_RETAILER = :1 AND m.TRDR_CLIENT = :2 " +
            "ORDER BY m.DOCUMENT_TYPE, m.DIRECTION";

        var ds = X.GETSQLDATASET(query, retailerId, clientId);

        // Convert dataset to result array
        var result = [];
        ds.FIRST;
        while (!ds.EOF) {
            result.push({
                id: ds.id,
                trdr_retailer: ds.TRDR_RETAILER,
                trdr_client: ds.TRDR_CLIENT,
                sosource: ds.SOSOURCE,
                fprms: ds.FPRMS,
                series: ds.SERIES,
                initialdirin: ds.INITIALDIRIN,
                initialdirout: ds.INITIALDIROUT,
                document_type: ds.DOCUMENT_TYPE,
                direction: ds.DIRECTION,
                auto_process: ds.AUTO_PROCESS,
                active: ds.ACTIVE,
                test_mode: ds.TEST_MODE,
                xml_root_path: ds.XML_ROOT_PATH,
                header_path: ds.HEADER_PATH,
                lines_path: ds.LINES_PATH,
                created_date: ds.CREATED_DATE,
                modified_date: ds.MODIFIED_DATE,
                created_by: ds.CREATED_BY,
                retailerName: ds.retailerName,
                clientName: ds.clientName
            });
            ds.NEXT;
        }

        return {
            success: true,
            data: result,
            total: result.length,
            params: {
                trdr_retailer: params.trdr_retailer,
                trdr_client: params.trdr_client
            }
        };
    } catch (e) {
        return {
            success: false,
            message: "Error retrieving document mappings: " + e.message,
            params: {
                trdr_retailer: params.trdr_retailer,
                trdr_client: params.trdr_client
            }
        };
    }
}

/**
 * Gets a single document-to-S1 mapping by ID
 * @param {Object} params Object with id property
 * @returns {Object} Single document mapping with success/error information
 */
function getDocumentMapping(params) {
    try {
        var id = params.id;
        var companyId = X.SYS.COMPANY;

        // Validate ID
        if (!id) {
            return {
                success: false,
                message: "Mapping ID is required",
                params: { id: params.id }
            };
        }

        // Query mapping by ID
        var query = "SELECT m.CCCDOCUMENTES1MAPPINGS as id, m.TRDR_RETAILER, m.TRDR_CLIENT, " +
            "m.SOSOURCE, m.FPRMS, m.SERIES, m.INITIALDIRIN, m.INITIALDIROUT, " +
            "m.DOCUMENT_TYPE, m.DIRECTION, m.AUTO_PROCESS, m.ACTIVE, m.TEST_MODE, " +
            "m.XML_ROOT_PATH, m.HEADER_PATH, m.LINES_PATH, " +
            "m.CREATED_DATE, m.MODIFIED_DATE, m.CREATED_BY, " +
            "r.NAME as retailerName, c.NAME as clientName " +
            "FROM CCCDOCUMENTES1MAPPINGS m " +
            "LEFT JOIN TRDR r ON r.TRDR = m.TRDR_RETAILER AND r.COMPANY = " + companyId + " " +
            "LEFT JOIN CCCRETAILERSCLIENTS c ON c.TRDR_CLIENT = m.TRDR_CLIENT " +
            "WHERE m.CCCDOCUMENTES1MAPPINGS = :1";

        var ds = X.GETSQLDATASET(query, id);

        // Check if mapping exists
        if (ds.RECORDCOUNT === 0) {
            return {
                success: false,
                message: "Document mapping with ID " + id + " not found",
                params: {
                    id: params.id
                }
            };
        }        // Create mapping object
        var mapping = {
            id: ds.id,
            trdr_retailer: ds.TRDR_RETAILER,
            trdr_client: ds.TRDR_CLIENT,
            sosource: ds.SOSOURCE,
            fprms: ds.FPRMS,
            series: ds.SERIES,
            initialdirin: ds.INITIALDIRIN,
            initialdirout: ds.INITIALDIROUT,
            document_type: ds.DOCUMENT_TYPE,
            direction: ds.DIRECTION,
            auto_process: ds.AUTO_PROCESS? true : false,
            active: ds.ACTIVE? true : false,
            test_mode: ds.TEST_MODE? true : false,
            xml_root_path: ds.XML_ROOT_PATH,
            header_path: ds.HEADER_PATH,
            lines_path: ds.LINES_PATH,
            created_date: ds.CREATED_DATE,
            modified_date: ds.MODIFIED_DATE,
            created_by: ds.CREATED_BY,
            retailerName: ds.retailerName,
            clientName: ds.clientName
        };

        return {
            success: true,
            data: mapping,
            params: {
                id: params.id
            }
        };
    } catch (e) {
        return {
            success: false,
            message: "Error retrieving document mapping: " + e.message,
            params: {
                id: params.id
            }
        };
    }
}

/**
 * Gets a specific document-to-S1 mapping by full mandatory criteria
 * @param {Object} params Object with trdr_retailer, trdr_client, sosource, fprms, and series properties
 * @returns {Object} Single document mapping with success/error information
 */
function getSpecificDocumentMapping(params) {
    try {
        var retailerId = params.trdr_retailer;
        var clientId = params.trdr_client;
        var sosource = params.sosource;
        var fprms = params.fprms;
        var series = params.series;
        var companyId = X.SYS.COMPANY;

        // Validate all required parameters
        if (!retailerId) {
            return { success: false, message: "Retailer ID (trdr_retailer) is required", params: { trdr_client: params.trdr_client, trdr_retailer: params.trdr_retailer, sosource: params.sosource, fprms: params.fprms, series: params.series } };
        }

        if (!clientId) {
            return { success: false, message: "Client ID (trdr_client) is required", params: { trdr_client: params.trdr_client, trdr_retailer: params.trdr_retailer, sosource: params.sosource, fprms: params.fprms, series: params.series } };
        }

        if (!sosource) {
            return { success: false, message: "Source (sosource) is required", params: { trdr_client: params.trdr_client, trdr_retailer: params.trdr_retailer, sosource: params.sosource, fprms: params.fprms, series: params.series } };
        }

        if (!fprms) {
            return { success: false, message: "FPRMS is required", params: { trdr_client: params.trdr_client, trdr_retailer: params.trdr_retailer, sosource: params.sosource, fprms: params.fprms, series: params.series } };
        }

        if (!series) {
            return { success: false, message: "Series is required", params: { trdr_client: params.trdr_client, trdr_retailer: params.trdr_retailer, sosource: params.sosource, fprms: params.fprms, series: params.series } };
        }

        // Build query with all mandatory parameters
        var query = "SELECT m.CCCDOCUMENTES1MAPPINGS as id, m.TRDR_RETAILER, m.TRDR_CLIENT, " +
            "m.SOSOURCE, m.FPRMS, m.SERIES, m.INITIALDIRIN, m.INITIALDIROUT, " +
            "m.DOCUMENT_TYPE, m.DIRECTION, m.AUTO_PROCESS, m.ACTIVE, m.TEST_MODE, " +
            "m.XML_ROOT_PATH, m.HEADER_PATH, m.LINES_PATH, " +
            "m.CREATED_DATE, m.MODIFIED_DATE, m.CREATED_BY, " +
            "r.NAME as retailerName, c.NAME as clientName " +
            "FROM CCCDOCUMENTES1MAPPINGS m " +
            "LEFT JOIN TRDR r ON r.TRDR = m.TRDR_RETAILER AND r.COMPANY = " + companyId + " " +
            "LEFT JOIN CCCRETAILERSCLIENTS c ON c.TRDR_CLIENT = m.TRDR_CLIENT " +
            "WHERE m.TRDR_RETAILER = :1 AND m.TRDR_CLIENT = :2 AND " +
            "m.SOSOURCE = :3 AND m.FPRMS = :4 AND m.SERIES = :5";

        // Execute query with parameters
        var ds = X.GETSQLDATASET(query, retailerId, clientId, sosource, fprms, series);

        // Check if mapping exists
        if (ds.RECORDCOUNT === 0) {
            return {
                success: false,
                message: "Document mapping not found for the specified criteria",
                params: {
                    trdr_retailer: params.trdr_retailer,
                    trdr_client: params.trdr_client,
                    sosource: params.sosource,
                    fprms: params.fprms,
                    series: params.series
                }
            };
        }

        // Create mapping object from first match
        var mapping = {
            id: ds.id,
            trdr_retailer: ds.TRDR_RETAILER,
            trdr_client: ds.TRDR_CLIENT,
            sosource: ds.SOSOURCE,
            fprms: ds.FPRMS,
            series: ds.SERIES,
            initialdirin: ds.INITIALDIRIN,
            initialdirout: ds.INITIALDIROUT,
            document_type: ds.DOCUMENT_TYPE,
            direction: ds.DIRECTION,
            auto_process: ds.AUTO_PROCESS,
            active: ds.ACTIVE,
            test_mode: ds.TEST_MODE,
            xml_root_path: ds.XML_ROOT_PATH,
            header_path: ds.HEADER_PATH,
            lines_path: ds.LINES_PATH,
            created_date: ds.CREATED_DATE,
            modified_date: ds.MODIFIED_DATE,
            created_by: ds.CREATED_BY,
            retailerName: ds.retailerName,
            clientName: ds.clientName
        };

        return {
            success: true,
            data: mapping,
            params: {
                trdr_retailer: retailerId,
                trdr_client: clientId,
                sosource: sosource,
                fprms: fprms,
                series: series
            }
        };
    } catch (e) {
        return {
            success: false,
            message: "Error retrieving specific document mapping: " + e.message,
            params: {
                trdr_retailer: params.trdr_retailer,
                trdr_client: params.trdr_client,
                sosource: params.sosource,
                fprms: params.fprms,
                series: params.series
            }
        };
    }
}

/**
 * Checks if a document mapping already exists for a particular combination of mandatory fields
 * @param {Object} params Object with TRDR_RETAILER, TRDR_CLIENT, SOSOURCE, FPRMS, and SERIES
 * @returns {Object} Object with exists flag, existing record (if found), and success/error information
 */
function checkDocumentMappingExists(params) {
    try {
        var retailerId = params.TRDR_RETAILER;
        var clientId = params.TRDR_CLIENT;
        var sosource = params.SOSOURCE;
        var fprms = params.FPRMS;
        var series = params.SERIES;
        var companyId = X.SYS.COMPANY;

        // Validate all required parameters
        if (!retailerId) {
            return {
                success: false,
                message: "Retailer ID (TRDR_RETAILER) is required",
                params: {
                    TRDR_RETAILER: params.TRDR_RETAILER,
                    TRDR_CLIENT: params.TRDR_CLIENT,
                    SOSOURCE: params.SOSOURCE,
                    FPRMS: params.FPRMS,
                    SERIES: params.SERIES
                }
            };
        }

        if (!clientId) {
            return {
                success: false,
                message: "Client ID (TRDR_CLIENT) is required",
                params: {
                    TRDR_RETAILER: params.TRDR_RETAILER,
                    TRDR_CLIENT: params.TRDR_CLIENT,
                    SOSOURCE: params.SOSOURCE,
                    FPRMS: params.FPRMS,
                    SERIES: params.SERIES
                }
            };
        }

        if (!sosource) {
            return {
                success: false,
                message: "Source (SOSOURCE) is required",
                params: {
                    TRDR_RETAILER: params.TRDR_RETAILER,
                    TRDR_CLIENT: params.TRDR_CLIENT,
                    SOSOURCE: params.SOSOURCE,
                    FPRMS: params.FPRMS,
                    SERIES: params.SERIES
                }
            };
        }

        if (!fprms) {
            return {
                success: false,
                message: "FPRMS is required",
                params: {
                    TRDR_RETAILER: params.TRDR_RETAILER,
                    TRDR_CLIENT: params.TRDR_CLIENT,
                    SOSOURCE: params.SOSOURCE,
                    FPRMS: params.FPRMS,
                    SERIES: params.SERIES
                }
            };
        }

        if (!series) {
            return {
                success: false,
                message: "SERIES is required",
                params: {
                    TRDR_RETAILER: params.TRDR_RETAILER,
                    TRDR_CLIENT: params.TRDR_CLIENT,
                    SOSOURCE: params.SOSOURCE,
                    FPRMS: params.FPRMS,
                    SERIES: params.SERIES
                }
            };
        }

        // Query for existing mapping with all five mandatory fields
        var query = "SELECT m.CCCDOCUMENTES1MAPPINGS as id, m.TRDR_RETAILER, m.TRDR_CLIENT, " +
            "m.SOSOURCE, m.FPRMS, m.SERIES, m.INITIALDIRIN, m.INITIALDIROUT, " +
            "m.DOCUMENT_TYPE, m.DIRECTION, m.AUTO_PROCESS, m.ACTIVE, m.TEST_MODE, " +
            "m.XML_ROOT_PATH, m.HEADER_PATH, m.LINES_PATH, " +
            "r.NAME as retailerName, c.NAME as clientName " +
            "FROM CCCDOCUMENTES1MAPPINGS m " +
            "LEFT JOIN TRDR r ON r.TRDR = m.TRDR_RETAILER AND r.COMPANY = " + companyId + " " +
            "LEFT JOIN CCCRETAILERSCLIENTS c ON c.TRDR_CLIENT = m.TRDR_CLIENT " +
            "WHERE m.TRDR_RETAILER = :1 AND m.TRDR_CLIENT = :2 AND " +
            "m.SOSOURCE = :3 AND m.FPRMS = :4 AND m.SERIES = :5";

        var ds = X.GETSQLDATASET(query, retailerId, clientId, sosource, fprms, series);

        // Check if we found a match
        var exists = ds.RECORDCOUNT > 0;
        var existing = null;

        // If exists, create mapping object from the record
        if (exists) {
            existing = {
                id: ds.id,
                trdr_retailer: ds.TRDR_RETAILER,
                trdr_client: ds.TRDR_CLIENT,
                sosource: ds.SOSOURCE,
                fprms: ds.FPRMS,
                series: ds.SERIES,
                initialdirin: ds.INITIALDIRIN,
                initialdirout: ds.INITIALDIROUT,
                document_type: ds.DOCUMENT_TYPE,
                direction: ds.DIRECTION,
                auto_process: ds.AUTO_PROCESS,
                active: ds.ACTIVE,
                test_mode: ds.TEST_MODE,
                xml_root_path: ds.XML_ROOT_PATH,
                header_path: ds.HEADER_PATH,
                lines_path: ds.LINES_PATH,
                retailerName: ds.retailerName,
                clientName: ds.clientName
            };
        }

        return {
            success: true,
            exists: exists,
            existing: existing,
            params: {
                TRDR_RETAILER: params.TRDR_RETAILER,
                TRDR_CLIENT: params.TRDR_CLIENT,
                SOSOURCE: params.SOSOURCE,
                FPRMS: params.FPRMS,
                SERIES: params.SERIES
            }
        };
    } catch (e) {
        return {
            success: false,
            message: "Error checking if document mapping exists: " + e.message,
            params: {
                TRDR_RETAILER: params.TRDR_RETAILER,
                TRDR_CLIENT: params.TRDR_CLIENT,
                SOSOURCE: params.SOSOURCE,
                FPRMS: params.FPRMS,
                SERIES: params.SERIES
            }
        };
    }
}

/**
 * Creates a new document-to-S1 mapping
 * @param {Object} params Mapping data
 * @returns {Object} Result with success/error information and new mapping ID
 */
function createDocumentMapping(params) {
    try {
        // Validate required fields
        if (!params.TRDR_RETAILER) {
            return { success: false, message: "TRDR_RETAILER is required" };
        }

        if (!params.TRDR_CLIENT) {
            return { success: false, message: "TRDR_CLIENT is required" };
        }

        if (!params.SOSOURCE) {
            return { success: false, message: "SOSOURCE is required" };
        }

        if (!params.FPRMS) {
            return { success: false, message: "FPRMS is required" };
        }

        if (!params.SERIES) {
            return { success: false, message: "SERIES is required" };
        }

        if (!params.DOCUMENT_TYPE) {
            return { success: false, message: "DOCUMENT_TYPE is required" };
        }

        if (!params.DIRECTION) {
            return { success: false, message: "DIRECTION is required" };
        }

        // Check if mapping already exists
        var existsCheck = checkDocumentMappingExists({
            TRDR_RETAILER: params.TRDR_RETAILER,
            DOCUMENT_TYPE: params.DOCUMENT_TYPE,
            DIRECTION: params.DIRECTION
        });

        if (existsCheck.exists) {
            return {
                success: false,
                message: "Document mapping already exists for retailer " + params.TRDR_RETAILER +
                    " with document type " + params.DOCUMENT_TYPE + " and direction " + params.DIRECTION
            };
        }

        // Prepare insert statement
        var sqlInsert = "INSERT INTO CCCDOCUMENTES1MAPPINGS (TRDR_RETAILER, TRDR_CLIENT, SOSOURCE, FPRMS, SERIES, " +
            "INITIALDIRIN, INITIALDIROUT, DOCUMENT_TYPE, DIRECTION, AUTO_PROCESS, ACTIVE, TEST_MODE, " +
            "XML_ROOT_PATH, HEADER_PATH, LINES_PATH, CREATED_DATE, CREATED_BY) " +
            "VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13, :14, :15, GETDATE(), :16); " +
            "SELECT SCOPE_IDENTITY() AS new_id;";

        // Execute insert
        var newId = X.SQL(sqlInsert,
            params.TRDR_RETAILER,
            params.TRDR_CLIENT,
            params.SOSOURCE,
            params.FPRMS,
            params.SERIES,
            params.INITIALDIRIN || '',
            params.INITIALDIROUT || '',
            params.DOCUMENT_TYPE,
            params.DIRECTION,
            params.AUTO_PROCESS !== undefined ? params.AUTO_PROCESS : 1,
            params.ACTIVE !== undefined ? params.ACTIVE : 1,
            params.TEST_MODE !== undefined ? params.TEST_MODE : 0,
            params.XML_ROOT_PATH || '',
            params.HEADER_PATH || '',
            params.LINES_PATH || '',
            params.CREATED_BY || 'API'
        );

        // Return success with new ID
        return {
            success: true,
            message: "Document mapping created successfully",
            id: parseInt(newId)
        };
    } catch (e) {
        return {
            success: false,
            message: "Error creating document mapping: " + e.message
        };
    }
}

/**
 * Updates an existing document-to-S1 mapping
 * @param {Object} params Mapping data with CCCDOCUMENTES1MAPPINGS (id)
 * @returns {Object} Result with success/error information
 */
function updateDocumentMapping(params) {
    try {
        // Validate ID
        if (!params.CCCDOCUMENTES1MAPPINGS) {
            return { success: false, message: "Mapping ID is required" };
        }

        // Check if mapping exists
        var query = "SELECT COUNT(*) as cnt FROM CCCDOCUMENTES1MAPPINGS WHERE CCCDOCUMENTES1MAPPINGS = :1";
        var count = X.SQL(query, params.CCCDOCUMENTES1MAPPINGS);

        if (parseInt(count) === 0) {
            return {
                success: false,
                message: "Document mapping with ID " + params.CCCDOCUMENTES1MAPPINGS + " not found"
            };
        }

        // If all five key fields are present, check if another record exists with the same values
        if (params.TRDR_RETAILER !== undefined &&
            params.TRDR_CLIENT !== undefined &&
            params.SOSOURCE !== undefined &&
            params.FPRMS !== undefined &&
            params.SERIES !== undefined) {

            var existsQuery = "SELECT COUNT(*) as cnt FROM CCCDOCUMENTES1MAPPINGS " +
                "WHERE TRDR_RETAILER = :1 AND TRDR_CLIENT = :2 AND " +
                "SOSOURCE = :3 AND FPRMS = :4 AND SERIES = :5 AND " +
                "CCCDOCUMENTES1MAPPINGS != :6";

            var existsCount = X.SQL(existsQuery,
                params.TRDR_RETAILER,
                params.TRDR_CLIENT,
                params.SOSOURCE,
                params.FPRMS,
                params.SERIES,
                params.CCCDOCUMENTES1MAPPINGS);

            if (parseInt(existsCount) > 0) {
                return {
                    success: false,
                    message: "Another document mapping already exists with the same retailer, client, source, FPRMS and series combination"
                };
            }
        }

        // Build update statement with only defined fields
        var updateFields = [];
        var updateSql = "UPDATE CCCDOCUMENTES1MAPPINGS SET ";
        var paramCounter = 2; // Starting from 2 since ID is param 1

        // Add all updateable fields
        var fields = [
            { name: "TRDR_RETAILER", value: params.TRDR_RETAILER },
            { name: "TRDR_CLIENT", value: params.TRDR_CLIENT },
            { name: "SOSOURCE", value: params.SOSOURCE },
            { name: "FPRMS", value: params.FPRMS },
            { name: "SERIES", value: params.SERIES },
            { name: "INITIALDIRIN", value: params.INITIALDIRIN },
            { name: "INITIALDIROUT", value: params.INITIALDIROUT },
            { name: "DOCUMENT_TYPE", value: params.DOCUMENT_TYPE },
            { name: "DIRECTION", value: params.DIRECTION },
            { name: "AUTO_PROCESS", value: params.AUTO_PROCESS },
            { name: "ACTIVE", value: params.ACTIVE },
            { name: "TEST_MODE", value: params.TEST_MODE },
            { name: "XML_ROOT_PATH", value: params.XML_ROOT_PATH },
            { name: "HEADER_PATH", value: params.HEADER_PATH },
            { name: "LINES_PATH", value: params.LINES_PATH }
        ];

        // Add each field if present
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].value !== undefined) {
                updateSql += fields[i].name + " = :" + paramCounter + ", ";
                updateFields.push(fields[i].value);
                paramCounter++;
            }
        }

        // Always add modified date
        updateSql += "MODIFIED_DATE = GETDATE()";

        // If no fields to update, return success
        if (updateFields.length === 0) {
            // Simple update just for the modified date
            X.RUNSQL("UPDATE CCCDOCUMENTES1MAPPINGS SET MODIFIED_DATE = GETDATE() WHERE CCCDOCUMENTES1MAPPINGS = :1", params.CCCDOCUMENTES1MAPPINGS);

            return {
                success: true,
                message: "Document mapping updated successfully (modified date only)"
            };
        }

        // Add WHERE clause
        updateSql += " WHERE CCCDOCUMENTES1MAPPINGS = :1";

        // Create parameter array with ID as first parameter
        var sqlParams = [params.CCCDOCUMENTES1MAPPINGS];

        // Add all update field values
        for (var j = 0; j < updateFields.length; j++) {
            sqlParams.push(updateFields[j]);
        }

        // Execute update with dynamic number of parameters
        switch (updateFields.length) {
            case 1:
                X.RUNSQL(updateSql, sqlParams[0], sqlParams[1]);
                break;
            case 2:
                X.RUNSQL(updateSql, sqlParams[0], sqlParams[1], sqlParams[2]);
                break;
            case 3:
                X.RUNSQL(updateSql, sqlParams[0], sqlParams[1], sqlParams[2], sqlParams[3]);
                break;
            case 4:
                X.RUNSQL(updateSql, sqlParams[0], sqlParams[1], sqlParams[2], sqlParams[3], sqlParams[4]);
                break;
            case 5:
                X.RUNSQL(updateSql, sqlParams[0], sqlParams[1], sqlParams[2], sqlParams[3], sqlParams[4], sqlParams[5]);
                break;
            case 6:
                X.RUNSQL(updateSql, sqlParams[0], sqlParams[1], sqlParams[2], sqlParams[3], sqlParams[4], sqlParams[5], sqlParams[6]);
                break;
            case 7:
                X.RUNSQL(updateSql, sqlParams[0], sqlParams[1], sqlParams[2], sqlParams[3], sqlParams[4], sqlParams[5], sqlParams[6], sqlParams[7]);
                break;
            case 8:
                X.RUNSQL(updateSql, sqlParams[0], sqlParams[1], sqlParams[2], sqlParams[3], sqlParams[4], sqlParams[5], sqlParams[6], sqlParams[7], sqlParams[8]);
                break;
            case 9:
                X.RUNSQL(updateSql, sqlParams[0], sqlParams[1], sqlParams[2], sqlParams[3], sqlParams[4], sqlParams[5], sqlParams[6], sqlParams[7], sqlParams[8], sqlParams[9]);
                break;
            case 10:
                X.RUNSQL(updateSql, sqlParams[0], sqlParams[1], sqlParams[2], sqlParams[3], sqlParams[4], sqlParams[5], sqlParams[6], sqlParams[7], sqlParams[8], sqlParams[9], sqlParams[10]);
                break;
            case 11:
                X.RUNSQL(updateSql, sqlParams[0], sqlParams[1], sqlParams[2], sqlParams[3], sqlParams[4], sqlParams[5], sqlParams[6], sqlParams[7], sqlParams[8], sqlParams[9], sqlParams[10], sqlParams[11]);
                break;
            case 12:
                X.RUNSQL(updateSql, sqlParams[0], sqlParams[1], sqlParams[2], sqlParams[3], sqlParams[4], sqlParams[5], sqlParams[6], sqlParams[7], sqlParams[8], sqlParams[9], sqlParams[10], sqlParams[11], sqlParams[12]);
                break;
            case 13:
                X.RUNSQL(updateSql, sqlParams[0], sqlParams[1], sqlParams[2], sqlParams[3], sqlParams[4], sqlParams[5], sqlParams[6], sqlParams[7], sqlParams[8], sqlParams[9], sqlParams[10], sqlParams[11], sqlParams[12], sqlParams[13]);
                break;
            case 14:
                X.RUNSQL(updateSql, sqlParams[0], sqlParams[1], sqlParams[2], sqlParams[3], sqlParams[4], sqlParams[5], sqlParams[6], sqlParams[7], sqlParams[8], sqlParams[9], sqlParams[10], sqlParams[11], sqlParams[12], sqlParams[13], sqlParams[14]);
                break;
            case 15:
                X.RUNSQL(updateSql, sqlParams[0], sqlParams[1], sqlParams[2], sqlParams[3], sqlParams[4], sqlParams[5], sqlParams[6], sqlParams[7], sqlParams[8], sqlParams[9], sqlParams[10], sqlParams[11], sqlParams[12], sqlParams[13], sqlParams[14], sqlParams[15]);
                break;
        }

        return {
            success: true,
            message: "Document mapping updated successfully"
        };
    } catch (e) {
        return {
            success: false,
            message: "Error updating document mapping: " + e.message
        };
    }
}

/**
 * Deletes a document-to-S1 mapping
 * @param {Object} params Object with id property
 * @returns {Object} Result with success/error information
 */
function deleteDocumentMapping(params) {
    try {
        var id = params.id;

        // Validate ID
        if (!id) {
            return { success: false, message: "Mapping ID is required" };
        }

        // Check if mapping exists
        var query = "SELECT COUNT(*) as cnt FROM CCCDOCUMENTES1MAPPINGS WHERE CCCDOCUMENTES1MAPPINGS = :1";
        var count = X.SQL(query, id);

        if (parseInt(count) === 0) {
            return {
                success: false,
                message: "Document mapping with ID " + id + " not found"
            };
        }

        // Check for related field mappings
        var fieldMappingsQuery = "SELECT COUNT(*) as cnt FROM CCCXMLS1MAPPINGS WHERE CCCDOCUMENTES1MAPPINGS = :1";
        var fieldMappingsCount = X.SQL(fieldMappingsQuery, id);

        if (parseInt(fieldMappingsCount) > 0) {
            // Delete related field mappings first
            var deleteFieldMappings = "DELETE FROM CCCXMLS1MAPPINGS WHERE CCCDOCUMENTES1MAPPINGS = :1";
            X.RUNSQL(deleteFieldMappings, id);
        }

        // Delete the document mapping
        var sqlDelete = "DELETE FROM CCCDOCUMENTES1MAPPINGS WHERE CCCDOCUMENTES1MAPPINGS = :1";
        X.RUNSQL(sqlDelete, id);

        return {
            success: true,
            message: "Document mapping deleted successfully"
        };
    } catch (e) {
        return {
            success: false,
            message: "Error deleting document mapping: " + e.message
        };
    }
}

/**
 * Gets field mappings by document mapping ID
 * @param {Object} params Object with document_mapping_id property
 * @returns {Object} List of field mappings with success/error information
 */
function getFieldMappings(params) {
    try {
        var documentMappingId = params.document_mapping_id;
        var companyId = X.SYS.COMPANY;

        // Validate document mapping ID
        if (!documentMappingId) {
            return {
                success: false,
                message: "Document mapping ID is required"
            };
        }        // Query field mappings by document mapping ID
        var query = "SELECT f.CCCXMLS1MAPPINGS as id, f.CCCDOCUMENTES1MAPPINGS, " +
            "COALESCE(f.XML_PATH, f.XMLNODE) as xml_path, " +
            "COALESCE(f.S1_TABLE, f.S1TABLE1) as s1_table, " +
            "COALESCE(f.S1_FIELD, f.S1FIELD1) as s1_field, " +
            "f.TRANSFORMATION, f.DEFAULT_VALUE, " +
            "COALESCE(f.REQUIRED, f.MANDATORY, 0) as is_required, " +
            "COALESCE(f.ACTIVE, 1) as active, " +
            "f.CREATED_DATE, f.MODIFIED_DATE, f.CREATED_BY, " +
            "d.DOCUMENT_TYPE, d.DIRECTION, r.NAME as retailerName, c.NAME as clientName " +
            "FROM CCCXMLS1MAPPINGS f " +
            "INNER JOIN CCCDOCUMENTES1MAPPINGS d ON d.CCCDOCUMENTES1MAPPINGS = f.CCCDOCUMENTES1MAPPINGS " +
            "LEFT JOIN TRDR r ON r.TRDR = d.TRDR_RETAILER AND r.COMPANY = " + companyId + " " +
            "LEFT JOIN CCCRETAILERSCLIENTS c ON c.TRDR_CLIENT = d.TRDR_CLIENT " +
            "WHERE f.CCCDOCUMENTES1MAPPINGS = :1 " +
            "ORDER BY COALESCE(f.XML_PATH, f.XMLNODE)";

        var ds = X.GETSQLDATASET(query, documentMappingId);

        // Convert dataset to result array
        var result = [];
        ds.FIRST;
        while (!ds.EOF) {            result.push({
                id: ds.id,
                document_mapping_id: ds.CCCDOCUMENTES1MAPPINGS,
                xml_path: ds.xml_path,
                s1_table: ds.s1_table,
                s1_field: ds.s1_field,
                transformation_rule: ds.TRANSFORMATION,
                default_value: ds.DEFAULT_VALUE,
                is_required: ds.is_required? true : false,
                active: ds.active? true : false,
                created_date: ds.CREATED_DATE,
                modified_date: ds.MODIFIED_DATE,
                created_by: ds.CREATED_BY,
                document_type: ds.DOCUMENT_TYPE,
                direction: ds.DIRECTION,
                retailerName: ds.retailerName,
                clientName: ds.clientName
            });
            ds.NEXT;
        }

        return {
            success: true,
            data: result,
            total: result.length
        };
    } catch (e) {
        return {
            success: false,
            message: "Error retrieving field mappings: " + e.message
        };
    }
}

/**
 * Gets a single field mapping by ID
 * @param {Object} params Object with id property
 * @returns {Object} Single field mapping with success/error information
 */
function getFieldMapping(params) {
    try {
        var id = params.id;
        var companyId = X.SYS.COMPANY;

        // Validate ID
        if (!id) {
            return {
                success: false,
                message: "Field mapping ID is required"
            };
        }        // Query field mapping by ID
        var query = "SELECT f.CCCXMLS1MAPPINGS as id, f.CCCDOCUMENTES1MAPPINGS, " +
            "COALESCE(f.XML_PATH, f.XMLNODE) as xml_path, " +
            "COALESCE(f.S1_TABLE, f.S1TABLE1) as s1_table, " +
            "COALESCE(f.S1_FIELD, f.S1FIELD1) as s1_field, " +
            "f.TRANSFORMATION, f.DEFAULT_VALUE, " +
            "COALESCE(f.REQUIRED, f.MANDATORY, 0) as is_required, " +
            "COALESCE(f.ACTIVE, 1) as active, " +
            "f.CREATED_DATE, f.MODIFIED_DATE, f.CREATED_BY, " +
            "d.DOCUMENT_TYPE, d.DIRECTION, r.NAME as retailerName, c.NAME as clientName "+
            "FROM CCCXMLS1MAPPINGS f " +
            "INNER JOIN CCCDOCUMENTES1MAPPINGS d ON d.CCCDOCUMENTES1MAPPINGS = f.CCCDOCUMENTES1MAPPINGS " +
            "LEFT JOIN TRDR r ON r.TRDR = d.TRDR_RETAILER AND r.COMPANY = " + companyId + " " +
            "LEFT JOIN CCCRETAILERSCLIENTS c ON c.TRDR_CLIENT = d.TRDR_CLIENT " +
            "WHERE f.CCCXMLS1MAPPINGS = :1";

        var ds = X.GETSQLDATASET(query, id);

        // Check if field mapping exists
        if (ds.EOF) {
            return {
                success: false,
                message: "Field mapping with ID " + id + " not found"
            };
        }        // Create field mapping object
        var mapping = {
            id: ds.id,
            document_mapping_id: ds.CCCDOCUMENTES1MAPPINGS,
            xml_path: ds.xml_path,
            s1_table: ds.s1_table,
            s1_field: ds.s1_field,
            transformation_rule: ds.TRANSFORMATION,
            default_value: ds.DEFAULT_VALUE,
            is_required: ds.is_required,
            active: ds.active,
            created_date: ds.CREATED_DATE,
            modified_date: ds.MODIFIED_DATE,
            created_by: ds.CREATED_BY,
            document_type: ds.DOCUMENT_TYPE,
            direction: ds.DIRECTION,
            retailerName: ds.retailerName,
            clientName: ds.clientName
        };

        return {
            success: true,
            data: mapping
        };
    } catch (e) {
        return {
            success: false,
            message: "Error retrieving field mapping: " + e.message
        };
    }
}

/**
 * Creates a new field mapping
 * @param {Object} params Field mapping data
 * @returns {Object} Result with success/error information and new mapping ID
 */
function createFieldMapping(params) {
    try {
        // Validate required fields
        if (!params.CCCDOCUMENTES1MAPPINGS) {
            return { success: false, message: "Document mapping ID (CCCDOCUMENTES1MAPPINGS) is required" };
        }

        if (!params.XML_PATH) {
            return { success: false, message: "XML path (XML_PATH) is required" };
        }

        if (!params.S1_TABLE) {
            return { success: false, message: "S1 table (S1_TABLE) is required" };
        }

        if (!params.S1_FIELD) {
            return { success: false, message: "S1 field (S1_FIELD) is required" };
        }

        // Check if document mapping exists
        var docQuery = "SELECT COUNT(*) as cnt FROM CCCDOCUMENTES1MAPPINGS WHERE CCCDOCUMENTES1MAPPINGS = :1";
        var docCount = X.SQL(docQuery, params.CCCDOCUMENTES1MAPPINGS);

        if (parseInt(docCount) === 0) {
            return {
                success: false,
                message: "Document mapping with ID " + params.CCCDOCUMENTES1MAPPINGS + " not found"
            };
        }

        // Check if field mapping already exists for this document mapping and XML path
        var existsQuery = "SELECT COUNT(*) as cnt FROM CCCXMLS1MAPPINGS " +
            "WHERE CCCDOCUMENTES1MAPPINGS = :1 AND " +
            "(XML_PATH = :2 OR XMLNODE = :2)";
        var existsCount = X.SQL(existsQuery, params.CCCDOCUMENTES1MAPPINGS, params.XML_PATH);

        if (parseInt(existsCount) > 0) {
            return {
                success: false,
                message: "Field mapping already exists for XML path " + params.XML_PATH +
                    " in document mapping " + params.CCCDOCUMENTES1MAPPINGS
            };
        }        // Prepare insert statement - using both old and new columns for compatibility
        var sqlInsert = "INSERT INTO CCCXMLS1MAPPINGS " +
            "(CCCDOCUMENTES1MAPPINGS, XMLNODE, XML_PATH, S1TABLE1, S1_TABLE, S1FIELD1, S1_FIELD, " +
            "TRANSFORMATION, DEFAULT_VALUE, MANDATORY, REQUIRED, " +
            "ACTIVE, CREATED_DATE, CREATED_BY) " +
            "VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, GETDATE(), :13); " +
            "SELECT SCOPE_IDENTITY() AS new_id;";// Execute insert
        var newId = X.SQL(sqlInsert,
            params.CCCDOCUMENTES1MAPPINGS,
            params.XML_PATH, // XMLNODE (old column)
            params.XML_PATH, // XML_PATH (new column)
            params.S1_TABLE, // S1TABLE1 (old column)
            params.S1_TABLE, // S1_TABLE (new column)            params.S1_FIELD, // S1FIELD1 (old column)
            params.S1_FIELD, // S1_FIELD (new column)
            params.TRANSFORMATION || null,
            params.DEFAULT_VALUE || null,
            params.IS_REQUIRED ? 1 : 0, // MANDATORY (old column)
            params.IS_REQUIRED ? 1 : 0, // REQUIRED (new column)
            params.ACTIVE !== undefined ? (params.ACTIVE ? 1 : 0) : 1,
            params.CREATED_BY || 'API'
        );

        // Return success with new ID
        return {
            success: true,
            message: "Field mapping created successfully",
            id: parseInt(newId)
        };
    } catch (e) {
        return {
            success: false,
            message: "Error creating field mapping: " + e.message
        };
    }
}

/**
 * Updates an existing field mapping
 * @param {Object} params Field mapping data with CCCXMLS1MAPPINGS (id)
 * @returns {Object} Result with success/error information
 */
function updateFieldMapping(params) {
    try {
        // Validate ID
        if (!params.CCCXMLS1MAPPINGS) {
            return { success: false, message: "Field mapping ID is required" };
        }

        // Check if field mapping exists
        var query = "SELECT COUNT(*) as cnt FROM CCCXMLS1MAPPINGS WHERE CCCXMLS1MAPPINGS = :1";
        var count = X.SQL(query, params.CCCXMLS1MAPPINGS);

        if (parseInt(count) === 0) {
            return {
                success: false,
                message: "Field mapping with ID " + params.CCCXMLS1MAPPINGS + " not found"
            };
        }

        // Build update statement with only defined fields - updating both old and new columns
        var updateFields = [];
        var updateSql = "UPDATE CCCXMLS1MAPPINGS SET ";

        // XML_PATH
        if (params.XML_PATH !== undefined) {
            updateSql += "XML_PATH = :2, XMLNODE = :2, ";
            updateFields.push(params.XML_PATH);
        }

        // S1_TABLE
        if (params.S1_TABLE !== undefined) {
            updateSql += "S1_TABLE = :" + (updateFields.length + 2) + ", S1TABLE1 = :" + (updateFields.length + 2) + ", ";
            updateFields.push(params.S1_TABLE);
        }

        // S1_FIELD
        if (params.S1_FIELD !== undefined) {
            updateSql += "S1_FIELD = :" + (updateFields.length + 2) + ", S1FIELD1 = :" + (updateFields.length + 2) + ", ";
            updateFields.push(params.S1_FIELD);
        }        // TRANSFORMATION
        if (params.TRANSFORMATION !== undefined) {
            updateSql += "TRANSFORMATION = :" + (updateFields.length + 2) + ", ";
            updateFields.push(params.TRANSFORMATION);
        }

        // DEFAULT_VALUE
        if (params.DEFAULT_VALUE !== undefined) {
            updateSql += "DEFAULT_VALUE = :" + (updateFields.length + 2) + ", ";
            updateFields.push(params.DEFAULT_VALUE);
        }        // IS_REQUIRED (maps to REQUIRED column in DB)
        if (params.IS_REQUIRED !== undefined) {
            var requiredValue = params.IS_REQUIRED ? 1 : 0;
            updateSql += "REQUIRED = :" + (updateFields.length + 2) + ", MANDATORY = :" + (updateFields.length + 2) + ", ";
            updateFields.push(requiredValue);
        }

        // ACTIVE
        if (params.ACTIVE !== undefined) {
            updateSql += "ACTIVE = :" + (updateFields.length + 2) + ", ";
            updateFields.push(params.ACTIVE ? 1 : 0);
        }

        // Always add modified date

        updateSql += "MODIFIED_DATE = GETDATE()";

        // If no fields to update, return success
        if (updateFields.length === 0) {
            // Simple update just for the modified date
            X.RUNSQL("UPDATE CCCXMLS1MAPPINGS SET MODIFIED_DATE = GETDATE() WHERE CCCXMLS1MAPPINGS = :1", params.CCCXMLS1MAPPINGS);
            return {
                success: true,
                message: "Field mapping updated successfully (modified date only)"
            };
        }

        // Add WHERE clause
        updateSql += " WHERE CCCXMLS1MAPPINGS = :1";

        // Execute update with dynamic number of parameters
        switch (updateFields.length) {
            case 1:
                X.RUNSQL(updateSql, params.CCCXMLS1MAPPINGS, updateFields[0]);
                break;
            case 2:
                X.RUNSQL(updateSql, params.CCCXMLS1MAPPINGS, updateFields[0], updateFields[1]);
                break;
            case 3:
                X.RUNSQL(updateSql, params.CCCXMLS1MAPPINGS, updateFields[0], updateFields[1], updateFields[2]);
                break;
            case 4:
                X.RUNSQL(updateSql, params.CCCXMLS1MAPPINGS, updateFields[0], updateFields[1], updateFields[2], updateFields[3]);
                break;
            case 5:
                X.RUNSQL(updateSql, params.CCCXMLS1MAPPINGS, updateFields[0], updateFields[1], updateFields[2], updateFields[3], updateFields[4]);
                break;
            case 6:
                X.RUNSQL(updateSql, params.CCCXMLS1MAPPINGS, updateFields[0], updateFields[1], updateFields[2], updateFields[3], updateFields[4], updateFields[5]);
                break;
            case 7:
                X.RUNSQL(updateSql, params.CCCXMLS1MAPPINGS, updateFields[0], updateFields[1], updateFields[2], updateFields[3], updateFields[4], updateFields[5], updateFields[6]);
                break;
            case 8:
                X.RUNSQL(updateSql, params.CCCXMLS1MAPPINGS, updateFields[0], updateFields[1], updateFields[2], updateFields[3], updateFields[4], updateFields[5], updateFields[6], updateFields[7]);
                break;
        }

        return {
            success: true,
            message: "Field mapping updated successfully"
        };
    } catch (e) {
        return {
            success: false,
            message: "Error updating field mapping: " + e.message
        };
    }
}

/**
 * Deletes a field mapping
 * @param {Object} params Object with id property
 * @returns {Object} Result with success/error information
 */
function deleteFieldMapping(params) {
    try {
        var id = params.id;

        // Validate ID
        if (!id) {
            return { success: false, message: "Field mapping ID is required" };
        }

        // Check if field mapping exists
        var query = "SELECT COUNT(*) as cnt FROM CCCXMLS1MAPPINGS WHERE CCCXMLS1MAPPINGS = :1";
        var count = X.SQL(query, id);

        if (parseInt(count) === 0) {
            return {
                success: false,
                message: "Field mapping with ID " + id + " not found"
            };
        }

        // Delete the field mapping
        var sqlDelete = "DELETE FROM CCCXMLS1MAPPINGS WHERE CCCXMLS1MAPPINGS = :1";
        X.RUNSQL(sqlDelete, id);

        return {
            success: true,
            message: "Field mapping deleted successfully"
        };
    } catch (e) {
        return {
            success: false,
            message: "Error deleting field mapping: " + e.message
        };
    }
}