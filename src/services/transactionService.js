const TransactionRepository = require("../repositories/transactionRepository");

const TransactionService = {
  getAllTransactionIn: async () => {
    try {
      const transactions = await TransactionRepository.getAllTransactionIn();
      return transactions;
    } catch (error) {
      throw new Error("Failed to fetch transactions");
    }
  },

  getTransactionInDetail: async (transactionInId) => {
    try {
      const transactionInDetail =
        await TransactionRepository.getTransactionInDetailById(transactionInId);
      const transactionIn = await TransactionRepository.getTransactionInById(
        transactionInId
      );

      return {
        transactionIn,
        transactionInDetail,
      };
    } catch (error) {
      throw new Error("Failed to fetch transaction details");
    }
  },
};

module.exports = TransactionService;
