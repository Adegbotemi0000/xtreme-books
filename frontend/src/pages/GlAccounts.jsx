import { SimpleListPage } from "../components/SimpleListPage";

export function GlAccounts() {
  return (
    <SimpleListPage
      title="Chart of Accounts"
      description="System accounts the posting engine depends on are protected from deletion."
      apiPath="/gl-accounts"
      hideDelete
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "type", label: "Type" },
        { key: "is_system_account", label: "System account", render: (r) => (r.is_system_account ? "Yes" : "No") },
      ]}
      formFields={[
        { key: "code", label: "Code", required: true },
        { key: "name", label: "Name", required: true },
        { key: "type", label: "Type (asset/liability/equity/income/expense)", required: true },
      ]}
    />
  );
}
