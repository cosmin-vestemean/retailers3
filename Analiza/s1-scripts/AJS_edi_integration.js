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
            processInLegacy = routingDs.PROCESS_IN_LEGACY === 1;
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
            "SELECT TRDR_CLIENT as id, NAME, WSURL, WSUSER, WSPASS, COMPANY, BRANCH " +
            "FROM CCCRETAILERSCLIENTS " +
            "WHERE COMPANY = " + companyId +
            " AND ACTIVE = 1 AND TRDR_CLIENT = :1 " +
            "ORDER BY NAME";
        var ds = X.GETSQLDATASET(query, 1);
        var result = [];
        ds.FIRST;
        while (!ds.EOF) {
            result.push({
                id: ds.id,
                name: ds.NAME,
                wsurl: ds.WSURL,
                wsuser: ds.WSUSER,
                wspass: ds.WSPASS,
                company: ds.COMPANY,
                branch: ds.BRANCH
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
            "SELECT TRDR_CLIENT as id, NAME, WSURL, WSUSER, WSPASS, COMPANY, BRANCH " +
            "FROM CCCRETAILERSCLIENTS " +
            "WHERE COMPANY = " + companyId +
            " AND TRDR_CLIENT = :1 AND ACTIVE = 1";
        var ds = X.GETSQLDATASET(query, id);
        if (ds.EOF) {
            return {
                success: false,
                message: "Client not found: " + id
            };
        }
        var client = {
            id: ds.id, name: ds.NAME,
            wsurl: ds.WSURL, wsuser: ds.WSUSER,
            wspass: ds.WSPASS, company: ds.COMPANY,
            branch: ds.BRANCH
        };
        return { success: true, data: client };
    } catch (e) {
        return {
            success: false,
            message: "Error retrieving retailer client: " + e.message
        };
    }
}