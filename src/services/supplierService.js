const supplierRepository = require("../repositories/supplierRepository");
const moment = require("moment-timezone");

module.exports = {
  getAllSuppliers: async () => {
    return await supplierRepository.findAllSuppliers();
  },

  getMasterData: async () => {
    const totalSuppliers = await supplierRepository.countTotalSuppliers();
    const totalTransactions = await supplierRepository.countTotalTransactions();
    const todayTransactions = await supplierRepository.countTodayTransactions();
    const mostActiveSupplier =
      await supplierRepository.findMostActiveSupplier();
    return {
      totalSuppliers,
      todayTransactions,
      totalTransactions,
      mostSupplierTransaction: mostActiveSupplier || "No transaction found",
    };
  },

  getMasterDynamicData: async () => {
    const suppliers = await supplierRepository.findAllMasterSuppliers();
    const products = await supplierRepository.findAllMasterProducts();
    const productTypes = await supplierRepository.findAllMasterProductTypes();
    const productMerks = await supplierRepository.findAllMasterProductMerks();
    const lastTransactionNumber =
      await supplierRepository.getLastTransactionNumber();
    const newTransactionNumber = generateNewTransactionNumber(
      lastTransactionNumber
    );

    return {
      suppliers,
      products,
      productTypes,
      productMerks,
      transactionNumber: newTransactionNumber,
    };
  },

  createSupplier: async (supplierName, supplierCode) => {
    const uppercaseCode = supplierCode.toUpperCase();
    const existingSupplier = await supplierRepository.checkSupplierByCode(
      uppercaseCode
    );

    if (existingSupplier > 0) {
      throw new Error("Supplier code already exists");
    }

    const createdAt = moment.tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");
    await supplierRepository.createSupplier(
      supplierName,
      uppercaseCode,
      createdAt
    );
  },

  deleteSupplier: async (id) => {
    const result = await supplierRepository.deleteSupplierById(id);
    if (!result) {
      throw new Error("Supplier not found");
    }
  },

  getSupplierDetail: async (id) => {
    const supplier = await supplierRepository.findSupplierById(id);
    if (!supplier) {
      throw new Error("Supplier not found");
    }
    return supplier;
  },

  updateSupplier: async (id, supplierName, supplierCode) => {
    const uppercaseCode = supplierCode.toUpperCase();
    const updatedAt = moment.tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");

    const result = await supplierRepository.updateSupplier(
      id,
      supplierName,
      uppercaseCode,
      updatedAt
    );
    if (!result) {
      throw new Error("Supplier not found");
    }
  },
};

const generateNewTransactionNumber = (lastNumber) => {
  const prefix = "FM-SMS/";
  let newNumber = 1;

  if (lastNumber) {
    const lastNumberInt = parseInt(lastNumber.split("/")[1], 10);
    newNumber = lastNumberInt + 1;
  }

  return `${prefix}${String(newNumber).padStart(3, "0")}`;
};
