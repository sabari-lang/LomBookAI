/**
 * Config Masters API - Barrel export
 * Re-exports from the new service layer
 * 
 * NOTE: This file is kept for backward compatibility.
 * Components should eventually migrate to import directly from:
 * - src/services/logistics/config/currencyService
 * - src/services/logistics/config/exchangeRateService  
 * - src/services/logistics/config/serviceService
 */

export {
    getCurrencies,
    getCurrencyByCode,
    createCurrency,
    updateCurrency,
    deleteCurrency,
} from "../../../services/logistics/config/currencyService";

export {
    getExchangeRates,
    getLatestExchangeRates,
    createExchangeRate,
    bulkImportExchangeRates,
    updateExchangeRate,
    deleteExchangeRate,
} from "../../../services/logistics/config/exchangeRateService";

export {
    getServices,
    getActiveServices,
    getServiceByCode,
    createService,
    updateService,
    deleteService,
    // Legacy aliases
    getServiceCodes,
    createServiceCode,
    updateServiceCode,
    deleteServiceCode,
} from "../../../services/logistics/config/serviceService";