const SalesService = require("../services/salesService");
const responseFormatter = require("../utils/responseFormatter");

module.exports = {
  all: async (req, res) => {
    try {
      const sales = await SalesService.getAllSales();
      return res.send(responseFormatter(200, "Get Sales Data Success", sales));
    } catch (error) {
      console.error("Sales All Error:", error);
      return res.send(responseFormatter(500, "Internal Server Error", null));
    }
  },

  master: async (req, res) => {
    try {
      const totalSales = await SalesService.getTotalSalesCount();

      return res.send(
        responseFormatter(200, "Get Sales Count Success", { totalSales })
      );
    } catch (error) {
      console.error("Sales Master Error:", error);
      return res.send(responseFormatter(500, "Internal Server Error", null));
    }
  },

  create: async (req, res) => {
    try {
      const { salesName } = req.body;
      const response = await SalesService.createSales(salesName);

      if (response.error) {
        return res.send(
          responseFormatter(response.statusCode, response.message, null)
        );
      }

      return res.send(responseFormatter(201, "Sales created successfully", {}));
    } catch (error) {
      console.error("Sales Create Error:", error);
      return res.send(responseFormatter(500, "Internal Server Error", null));
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const response = await SalesService.deleteSales(id);

      if (response.error) {
        return res.send(
          responseFormatter(response.statusCode, response.message, null)
        );
      }

      return res.send(responseFormatter(200, "Sales deleted successfully", {}));
    } catch (error) {
      console.error("Sales Delete Error:", error);
      return res.send(responseFormatter(500, "Internal Server Error", null));
    }
  },

  detail: async (req, res) => {
    try {
      const { id } = req.params;
      const [salesDetail, salesTransaction] = await SalesService.getSalesDetail(
        id
      );

      if (!salesDetail) {
        return res.send(responseFormatter(404, "Sales not found", null));
      }

      return res.send(
        responseFormatter(200, "Get Sales Detail Success", {
          salesDetail,
          salesTransaction,
        })
      );
    } catch (error) {
      console.error("Sales Detail Error:", error);
      return res.send(responseFormatter(500, "Internal Server Error", null));
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { salesName } = req.body;
      const response = await SalesService.updateSales(id, salesName);

      if (response.error) {
        return res.send(
          responseFormatter(response.statusCode, response.message, null)
        );
      }

      return res.send(responseFormatter(200, "Sales updated successfully", {}));
    } catch (error) {
      console.error("Sales Update Error:", error);
      return res.send(responseFormatter(500, "Internal Server Error", null));
    }
  },
};
