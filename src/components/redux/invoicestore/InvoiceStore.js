import { configureStore, combineReducers } from "@reduxjs/toolkit";
import invoicesReducer from "../invoiceslice/InvoiceSlice";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore, createTransform } from "redux-persist";

const rootReducer = combineReducers({
    invoices: invoicesReducer,
});

const persistConfig = {
    key: "root",
    storage,
    whitelist: ["invoices"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const InvoiceStore = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // needed for redux-persist internals
        }),
});

export const persistor = persistStore(InvoiceStore);
