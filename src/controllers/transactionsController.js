const { pool, query } = require("../database");
const moment = require("moment-timezone");

const env = process.env;

module.exports = {
  transactionInList: async (req, res) => {
    try {
      const getTransactionIn = await query(
        `SELECT ti.*,s.supplier_name,s.supplier_code FROM transaction_in as ti
        LEFT JOIN suppliers as s on s.supplier_id = ti.supplier_id
        ORDER BY ti.created_at DESC
        `
      );

      return res.status(200).send({
        message: "Get All Transaction In Data Success",
        data: getTransactionIn,
      });
    } catch (error) {
      console.error("All Transaction In Error:", error);
      res.status(500).send({ message: error });
    }
  },
  transactionInDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const getTransactionInDetail = await query(
        `SELECT tid.transaction_in_id,tid.transaction_in_detail_id,s.supplier_name,s.supplier_code,p.product_name ,pt.type_name ,pm.merk_name,p.akl_akd,p.price ,p.stock,p.expired_date  FROM transaction_in as ti
        LEFT JOIN suppliers s on s.supplier_id = ti.supplier_id
        LEFT JOIN transaction_in_detail  tid on tid.transaction_in_id = ti.transaction_in_id 
        LEFT JOIN products p on p.product_id = tid.product_id 
        LEFT JOIN product_type pt on p.product_type = pt.product_type_id 
        LEFT JOIN product_merk pm on p.product_merk = pm.product_merk_id 
        WHERE tid.transaction_in_id = ${id}
        `
      );

      return res.status(200).send({
        message: "Get Transaction In Detail Data Success",
        data: getTransactionInDetail,
      });
    } catch (error) {
      console.error("Transaction In Detail Error:", error);
      res.status(500).send({ message: error });
    }
  },
  insertTransactionIn: async (req, res) => {
    try {
      const {
        noFaktur,
        note,
        paymentMethod,
        productList,
        supplierId,
        timeToPayment,
      } = req.body;
      const createdDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      const insertTransaction = await query(
        `INSERT INTO transaction_in (no_faktur, note, payment_method, supplier_id, time_to_payment,created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [noFaktur, note, paymentMethod, supplierId, timeToPayment, createdDate]
      );

      const transactionId = insertTransaction.insertId;

      // for (let product of productList) {
      //   await query(
      //     `INSERT INTO transaction_in_detail (transaction_id, product_name, product_expired, product_qty, product_type, product_brand) VALUES (?, ?, ?, ?, ?, ?)`,
      //     [
      //       transactionId,
      //       product.productName,
      //       product.productExpired,
      //       product.productQty,
      //       product.productType,
      //       product.productBrand,
      //     ]
      //   );
      // }

      for (let product of productList) {
        await query(
          `INSERT INTO transaction_in_detail (transaction_in_id, product_id) VALUES (?, ?)`,
          [transactionId, product.productName]
        );
      }

      return res.status(200).send({
        message: "Data transaksi masuk berhasil disimpan",
        data: insertTransaction,
      });
    } catch (error) {
      console.error("Transaction In Detail Error:", error);
      res.status(500).send({ message: error });
    }
  },
  transactionOutList: async (req, res) => {
    try {
      const { id } = req.params;
      const getTransactionOut = await query(
        `SELECT tro.*, c.customer_name 
        FROM transaction_out  tro
        LEFT JOIN customers c ON c.customer_id = tro.customer_id
        WHERE tro.customer_id = ${id}
        ORDER BY tro.created_at DESC 
        `
      );

      return res.status(200).send({
        message: "Get All Transaction In Data Success",
        data: getTransactionOut,
      });
    } catch (error) {
      console.error("All Transaction In Error:", error);
      res.status(500).send({ message: error });
    }
  },
  insertTransactionOut: async (req, res) => {
    try {
      const {
        noFaktur,
        paymentMethod,
        productList,
        customerId,
        timeToPayment,
        totalPayment,
        totalPaymentTax,
        deliveryDate,
        note,
        noPo,
        salesman,
      } = req.body;

      if (
        !noFaktur ||
        !paymentMethod ||
        !productList ||
        !customerId ||
        !timeToPayment
      ) {
        return res
          .status(400)
          .send({ message: "All values except 'note' must be filled" });
      }

      const createdDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      const insertTransaction = await query(
        `INSERT INTO transaction_out (no_faktur, no_po, salesman, note, payment_method, customer_id, time_to_payment, created_at,delivery_date,amount,amount_tax) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          noFaktur,
          noPo,
          salesman,
          note,
          paymentMethod,
          customerId,
          timeToPayment,
          createdDate,
          deliveryDate,
          totalPayment,
          totalPaymentTax,
        ]
      );

      const transactionId = insertTransaction.insertId;

      for (let product of productList) {
        await query(
          `INSERT INTO transaction_out_detail (transaction_out_id, product_id, qty, discount, ppn, pph, cn, amount,amount_tax) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transactionId,
            product.productName,
            product.productQty,
            product.productDisc,
            product.productPpn,
            product.productPph,
            product.productCn,
            product.productPrice,
            product.productTotalPrice,
          ]
        );
      }

      return res.status(200).send({
        message: "Data transaksi keluar berhasil disimpan",
        data: insertTransaction,
      });
    } catch (error) {
      console.error("Transaction Out Detail Error:", error);
      res.status(500).send({ message: error });
    }
  },
  transactionOutDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const getTransactionOutDetail = await query(
        `SELECT 
        tod.transaction_out_id,
        tod.transaction_out_detail_id,
        tod.product_id,
        tod.discount,
        tod.qty,
        tod.ppn,
        tod.pph,
        tod.cn,
        tod.amount,
        tod.amount_tax,
        c.customer_name,
        p.product_name,
        pt.type_name,
        pm.merk_name,
        p.akl_akd,
        p.price,
        p.stock,
        p.expired_date  
    FROM 
        transaction_out AS t_out
    LEFT JOIN 
        customers AS c ON c.customer_id = t_out.customer_id
    LEFT JOIN 
        transaction_out_detail AS tod ON tod.transaction_out_id = t_out.transaction_out_id 
    LEFT JOIN 
        products AS p ON p.product_id = tod.product_id 
    LEFT JOIN 
        product_type AS pt ON p.product_type = pt.product_type_id 
    LEFT JOIN 
        product_merk AS pm ON p.product_merk = pm.product_merk_id
        WHERE t_out.transaction_out_id = ${id};
        `
      );
      const getTransactionOut = await query(
        `SELECT * FROM transaction_out WHERE transaction_out_id = ${id}`
      );

      return res.status(200).send({
        message: "Get Transaction Out Detail Data Success",
        data: {
          transactionOut: getTransactionOut[0],
          transactionOutDetail: getTransactionOutDetail,
        },
      });
    } catch (error) {
      console.error("Transaction Out Detail Error:", error);
      res.status(500).send({ message: error });
    }
  },
};
