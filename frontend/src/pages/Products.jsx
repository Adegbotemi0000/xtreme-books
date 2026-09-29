import { SimpleListPage } from "../components/SimpleListPage";

export function Products() {
  return (
    <SimpleListPage
      title="Products"
      apiPath="/products"
      importable
      columns={[
        { key: "name", label: "Name" },
        { key: "sku", label: "SKU" },
        { key: "unit_price", label: "Unit price", render: (r) => `₦${Number(r.unit_price).toLocaleString()}` },
        { key: "vat_rate", label: "VAT %" },
        { key: "stock_quantity", label: "Stock" },
      ]}
      formFields={[
        { key: "name", label: "Name", required: true },
        { key: "sku", label: "SKU" },
        { key: "unitPrice", label: "Unit price", type: "number", required: true },
        { key: "cost", label: "Cost", type: "number" },
        { key: "vatRate", label: "VAT %", type: "number" },
        { key: "reorderLevel", label: "Reorder level", type: "number" },
      ]}
    />
  );
}
