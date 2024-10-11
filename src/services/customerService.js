const customerRepository = require("../repositories/customerRepository");
const moment = require("moment-timezone");

const customerService = {
  getAllCustomers: async () => {
    const customers = await customerRepository.getAllCustomers();
    const count = await customerRepository.countCustomers();
    return {
      customers,
      total: count[0].totalCustomers,
    };
  },

  getCustomerDetail: async (id) => {
    const customer = await customerRepository.getCustomerById(id);
    if (customer.length === 0) {
      throw new Error("Customer not found");
    }
    return customer[0];
  },

  createCustomer: async (customerName) => {
    const createdDate = moment.tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");
    return await customerRepository.createCustomer(customerName, createdDate);
  },

  updateCustomer: async (id, customerName) => {
    const updatedDate = moment.tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");

    const updateResult = await customerRepository.updateCustomer(
      id,
      customerName,
      updatedDate
    );

    if (updateResult.affectedRows == 0) {
      throw new Error("Customer not found");
    }
  },

  deleteCustomer: async (id) => {
    const deleteResult = await customerRepository.deleteCustomer(id);
    if (deleteResult.affectedRows == 0) {
      throw new Error("Customer not found");
    }
  },

  getMasterData: async (id) => {
    const customerTransactions =
      await customerRepository.countCustomerTransactions(id);
    const todayCustomerTransactions =
      await customerRepository.countTodayCustomerTransactions(id);
    const customer = await customerRepository.getCustomerById(id);
    if (customer.length === 0) {
      throw new Error("Customer not found");
    }
    return {
      customerName: customer[0].customer_name,
      todayTransaction: todayCustomerTransactions[0].totalTodayTransaction,
      totalTransaction: customerTransactions[0].totalTransaction,
    };
  },

  getAllMasterData: async () => {
    const totalTransactions = await customerRepository.countAllTransactions();
    const todayTransactions = await customerRepository.countTodayTransactions();
    return {
      todayTransaction: todayTransactions[0].totalTodayTransaction,
      totalTransaction: totalTransactions[0].totalTransaction,
    };
  },
};

module.exports = customerService;
