// User form <-> API mapping helpers

export const mapFormToApi = (v) => ({
  userName: v.userName,
  firstName: v.firstName,
  lastName: v.lastName,
  MobileNumber: v.mobileNumber,
  mobileNumber: v.mobileNumber,
  email: v.email,
  role: v.role,
  isActive: typeof v.isActive === 'boolean' ? v.isActive : (v.isActive === 'Active' || v.isActive === true),
  password: v.password || undefined,
  address: v.address,
  city: v.city,
  state: v.state,
  pincode: v.pincode,
  branch: v.branch,
  // add other fields as needed
});

export const mapApiToForm = (u) => ({
  userName: u.userName ?? u.username ?? "",
  firstName: u.firstName ?? "",
  lastName: u.lastName ?? "",
  email: u.email ?? "",
  mobileNumber: u.MobileNumber ?? u.mobileNumber ?? u.mobile ?? "",
  role: u.role ?? "",
  isActive: typeof u.isActive === 'boolean' ? u.isActive : (u.isActive === 'Active'),
  password: "",
  address: u.address ?? "",
  city: u.city ?? "",
  state: u.state ?? "",
  pincode: u.pincode ?? "",
  branch: u.branch ?? "",
  // add other fields as needed
});
