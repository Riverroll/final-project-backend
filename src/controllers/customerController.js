const customerService = require("../services/customerService");
const responseFormatter = require("../utils/responseFormatter");

module.exports = {
  all: async (req, res) => {
    try {
      const customers = await customerService.getAllCustomers();
      return res
        .status(200)
        .send(responseFormatter(200, "Get Customer Data Success", customers));
    } catch (error) {
      console.error("Customer All Error:", error);
      return res
        .status(500)
        .send(responseFormatter(500, "Internal Server Error", error.message));
    }
  },

  allMaster: async (req, res) => {
    try {
      const masterData = await customerService.getAllMasterData();
      return res
        .status(200)
        .send(responseFormatter(200, "Get Master Data Success", masterData));
    } catch (error) {
      console.error("Customer All Master Error:", error);
      return res
        .status(500)
        .send(responseFormatter(500, "Internal Server Error", error.message));
    }
  },

  master: async (req, res) => {
    try {
      const { id } = req.params;
      const masterData = await customerService.getMasterData(id);
      if (!masterData) {
        return res
          .status(404)
          .send(responseFormatter(404, "Customer not found", null));
      }
      return res
        .status(200)
        .send(responseFormatter(200, "Get Customer Data Success", masterData));
    } catch (error) {
      console.error("Customer Master Error:", error);
      return res
        .status(500)
        .send(responseFormatter(500, "Internal Server Error", error.message));
    }
  },

  create: async (req, res) => {
    try {
      const { customerName } = req.body;

      if (!customerName) {
        return res
          .status(400)
          .send(responseFormatter(400, "Customer name is required", null));
      }

      await customerService.createCustomer(customerName);

      return res
        .status(200)
        .send(responseFormatter(200, "Customer created successfully", null));
    } catch (error) {
      console.error("Create Customer Error:", error);
      return res
        .status(500)
        .send(responseFormatter(500, "Internal Server Error", error.message));
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .send(responseFormatter(400, "ID is required", null));
      }

      const deleted = await customerService.deleteCustomer(id);

      return res
        .status(200)
        .send(responseFormatter(200, "Customer deleted successfully", null));
    } catch (error) {
      console.error("Delete Customer Error:", error);
      return res
        .status(500)
        .send(responseFormatter(500, "Internal Server Error", error.message));
    }
  },

  detail: async (req, res) => {
    try {
      const { id } = req.params;
      const customer = await customerService.getCustomerDetail(id);
      if (!customer) {
        return res
          .status(404)
          .send(responseFormatter(404, "Customer not found", null));
      }

      return res
        .status(200)
        .send(responseFormatter(200, "Get Customer Detail Success", customer));
    } catch (error) {
      console.error("Customer Detail Error:", error);
      return res
        .status(500)
        .send(responseFormatter(500, "Internal Server Error", error.message));
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { customerName } = req.body;

      if (!customerName) {
        return res
          .status(400)
          .send(responseFormatter(400, "Customer name is required", null));
      }

      const updated = await customerService.updateCustomer(id, customerName);

      return res
        .status(200)
        .send(responseFormatter(200, "Customer updated successfully", null));
    } catch (error) {
      console.error("Customer Update Error:", error);
      return res
        .status(500)
        .send(responseFormatter(500, "Internal Server Error", error.message));
    }
  },
};
