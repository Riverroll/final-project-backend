const supplierService = require("../services/supplierService");
const responseFormatter = require("../utils/responseFormatter");

module.exports = {
  all: async (req, res) => {
    try {
      const suppliers = await supplierService.getAllSuppliers();
      return res
        .status(200)
        .send(responseFormatter(200, "Get Supplier Data Success", suppliers));
    } catch (error) {
      console.error("Supplier All Error:", error);
      return res.status(500).send(responseFormatter(500, error.message, null));
    }
  },

  master: async (req, res) => {
    try {
      const masterData = await supplierService.getMasterData();
      return res
        .status(200)
        .send(
          responseFormatter(200, "Get Master Supplier Data Success", masterData)
        );
    } catch (error) {
      console.error("Supplier Master Error:", error);
      return res.status(500).send(responseFormatter(500, error.message, null));
    }
  },

  masterDynamic: async (req, res) => {
    try {
      const masterDynamicData = await supplierService.getMasterDynamicData();
      return res
        .status(200)
        .send(
          responseFormatter(
            200,
            "Get Master Dynamic Data Success",
            masterDynamicData
          )
        );
    } catch (error) {
      console.error("Master Dynamic Error:", error);
      return res.status(500).send(responseFormatter(500, error.message, null));
    }
  },

  create: async (req, res) => {
    try {
      const { supplierName, supplierCode } = req.body;
      await supplierService.createSupplier(supplierName, supplierCode);
      return res
        .status(200)
        .send(responseFormatter(200, "Supplier created successfully", null));
    } catch (error) {
      console.error("Create Supplier Error:", error);
      return res.status(500).send(responseFormatter(500, error.message, null));
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await supplierService.deleteSupplier(id);
      return res.status(200).send(
        responseFormatter(200, "Supplier deleted successfully", {
          deletedId: id,
        })
      );
    } catch (error) {
      console.error("Delete Supplier Error:", error);
      return res.status(500).send(responseFormatter(500, error.message, null));
    }
  },

  detail: async (req, res) => {
    try {
      const { id } = req.params;
      const supplier = await supplierService.getSupplierDetail(id);
      return res
        .status(200)
        .send(responseFormatter(200, "Get Supplier Detail Success", supplier));
    } catch (error) {
      console.error("Supplier Detail Error:", error);
      return res.status(500).send(responseFormatter(500, error.message, null));
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { supplierName, supplierCode } = req.body;
      await supplierService.updateSupplier(id, supplierName, supplierCode);
      return res
        .status(200)
        .send(responseFormatter(200, "Supplier updated successfully", null));
    } catch (error) {
      console.error("Update Supplier Error:", error);
      return res.status(500).send(responseFormatter(500, error.message, null));
    }
  },
};
