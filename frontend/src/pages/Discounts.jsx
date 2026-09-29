import { SimpleListPage } from "../components/SimpleListPage";

export function Discounts() {
  return (
    <SimpleListPage
      title="Discounts"
      apiPath="/discounts"
      hideDelete
      columns={[
        { key: "name", label: "Name" },
        { key: "type", label: "Type" },
        { key: "value", label: "Value" },
      ]}
      formFields={[
        { key: "name", label: "Name", required: true },
        { key: "type", label: "Type (percentage/fixed)", required: true },
        { key: "value", label: "Value", type: "number", required: true },
      ]}
    />
  );
}
