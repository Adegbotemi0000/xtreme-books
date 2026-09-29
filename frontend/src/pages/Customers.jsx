import { SimpleListPage } from "../components/SimpleListPage";

export function Customers() {
  return (
    <SimpleListPage
      title="Customers"
      apiPath="/customers"
      columns={[
        { key: "name", label: "Name" },
        { key: "tin", label: "TIN" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
      ]}
      formFields={[
        { key: "name", label: "Name", required: true },
        { key: "tin", label: "TIN (optional, recommended)" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "address", label: "Address" },
      ]}
    />
  );
}
