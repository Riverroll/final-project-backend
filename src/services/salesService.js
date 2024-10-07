const moment = require("moment-timezone");
const SalesRepository = require("../repositories/salesRepository");

const SalesService = {
  getAllSales: async () => {
    return await SalesRepository.getAllSales();
  },

  getTotalSalesCount: async () => {
    return await SalesRepository.getTotalSalesCount();
  },

  createSales: async (salesName) => {
    if (!salesName) {
      return {
        error: true,
        statusCode: 400,
        message: "Sales name is required",
      };
    }
    const createdDate = moment.tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");
    await SalesRepository.createSales(salesName, createdDate);
    return { error: false };
  },

  deleteSales: async (id) => {
    const result = await SalesRepository.deleteSalesById(id);
    if (result.affectedRows === 0) {
      return { error: true, statusCode: 404, message: "Sales not found" };
    }
    return { error: false };
  },

  getSalesDetail: async (id) => {
    const salesDetail = await SalesRepository.getSalesById(id);
    const salesTransaction = await SalesRepository.getSalesTransactions(id);
    if (!salesDetail.length) {
      return [null, null];
    }
    return [salesDetail[0], salesTransaction];
  },

  updateSales: async (id, salesName) => {
    if (!salesName) {
      return {
        error: true,
        statusCode: 400,
        message: "Sales Name is required",
      };
    }
    const updatedDate = moment.tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");
    const result = await SalesRepository.updateSalesById(
      salesName,
      updatedDate,
      id
    );
    if (result.affectedRows === 0) {
      return { error: true, statusCode: 404, message: "Sales not found" };
    }
    return { error: false };
  },
};

module.exports = SalesService;
