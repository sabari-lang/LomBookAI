import { COUNTRIES } from "./countries";
import { STATES_BY_COUNTRY } from "./states";

export const getCountries = () => COUNTRIES;

export const getStatesByCountry = (countryCode) =>
  STATES_BY_COUNTRY[countryCode] ?? [];
