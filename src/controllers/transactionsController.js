const { pool, query } = require("../database");
const moment = require("moment-timezone");
const TransactionService = require("../services/transactionService");
const responseFormatter = require("../utils/responseFormatter");

module.exports = {
  getAllTransactionIn: async (req, res) => {
    try {
      const transactions = await TransactionService.getAllTransactionIn();
      return res.send(
        responseFormatter(
          200,
          "Get All Transaction In Data Success",
          transactions
        )
      );
    } catch (error) {
      console.error("All Transaction In Error:", error);
      return res.send(responseFormatter(500, "Internal Server Error", null));
    }
  },
  getTransactionInDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const transactionDetail = await TransactionService.getTransactionInDetail(
        id
      );

      if (transactionDetail.error) {
        return res.send(
          responseFormatter(
            transactionDetail.statusCode,
            transactionDetail.message,
            null
          )
        );
      }

      return res.send(
        responseFormatter(
          200,
          "Get Transaction In Detail Data Success",
          transactionDetail
        )
      );
    } catch (error) {
      console.error("Transaction In Detail Error:", error);
      return res.send(responseFormatter(500, "Internal Server Error", null));
    }
  },
  insertTransactionIn: async (req, res) => {
    try {
      const {
        noFaktur,
        noKita,
        note,
        paymentMethod,
        productList,
        supplierId,
        tax,
        timeToPayment,
        userId,
        shippingCost,
        fakturDate,
      } = req.body;
      const createdDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      const errors = [];
      if (!noKita) {
        errors.push({ field: "noKita", message: "No Kita is required" });
      }
      if (!noFaktur) {
        errors.push({ field: "noFaktur", message: "Faktur is required" });
      }
      if (!supplierId) {
        errors.push({ field: "supplierId", message: "Supplier is required" });
      }
      if (!timeToPayment) {
        errors.push({
          field: "timeToPayment",
          message: "Time to Payment is required",
        });
      }
      if (!paymentMethod) {
        errors.push({
          field: "paymentMethod",
          message: "Payment Method is required",
        });
      }
      if (productList.length === 0) {
        errors.push({
          field: "productList",
          message: "Product List is required",
        });
      } else {
        productList.forEach((product, index) => {
          if (!product.product_price) {
            errors.push({
              field: `productList`,
              message: "Product Price is required",
            });
          }
        });
      }

      if (errors.length > 0) {
        return res.status(400).send({ errors });
      }

      let amount = 0;

      await query("START TRANSACTION");

      const insertTransaction = await query(
        `INSERT INTO transaction_in (no_faktur, faktur_date, no_kita, note, payment_method, amount, supplier_id, time_to_payment, created_at, tax, pic, shipping_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          noFaktur,
          fakturDate,
          noKita,
          note,
          paymentMethod,
          amount,
          supplierId,
          timeToPayment,
          createdDate,
          tax,
          userId,
          shippingCost,
        ]
      );

      const transactionId = insertTransaction.insertId;

      for (let product of productList) {
        // Ambil harga dari produk
        const productData = await query(
          `SELECT price, stock, isExpired FROM products WHERE product_id = ?`,
          [product.product_id]
        );

        if (productData.length === 0) {
          await query("ROLLBACK");
          return res.status(404).send({
            message: `Product not found for product ID ${product.product_id}`,
          });
        }

        const price = product.product_price;
        const discount = product.product_discount || 0;
        const discountedPrice = price - price * (discount / 100);
        const totalPrice = discountedPrice * product.quantity;

        amount += totalPrice;

        await query(
          `INSERT INTO transaction_in_detail (transaction_in_id, product_id, price, quantity, product_code, batch_lot, discount, price_discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transactionId,
            product.product_id,
            price,
            product.quantity,
            product.product_code,
            product.batch_lot,
            discount,
            discountedPrice,
          ]
        );

        if (productData[0].isExpired == 1) {
          await query(
            `INSERT INTO product_expired (transaction_in_id, product_id, expired_date, quantity) VALUES (?, ?, ?, ?)`,
            [
              transactionId,
              product.product_id,
              product.expired_date,
              product.quantity,
            ]
          );

          await query(
            `UPDATE products SET stock = stock + ? WHERE product_id = ?`,
            [product.quantity, product.product_id]
          );
        } else {
          await query(
            `UPDATE products SET stock = stock + ? WHERE product_id = ?`,
            [product.quantity, product.product_id]
          );
        }
      }

      // Hitung nilai amount_tax
      const amountTax = amount + amount * (tax / 100);

      // Update amount dan amount_tax di dalam tabel transaction_in
      await query(
        `UPDATE transaction_in SET amount = ?, amount_tax = ? WHERE transaction_in_id = ?`,
        [amount, amountTax, transactionId]
      );

      // Commit transaksi
      await query("COMMIT");

      return res.status(200).send({
        message: "Transaction created successfully",
        data: insertTransaction,
      });
    } catch (error) {
      console.error("Failed to insert transaction:", error);
      await query("ROLLBACK");
      res.status(500).send({ message: error });
    }
  },
  updateTransactionIn: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        noFaktur,
        fakturDate,
        note,
        paymentMethod,
        productList,
        supplierId,
        tax,
        timeToPayment,
        shippingCost,
      } = req.body;
      const updatedDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      // Ambil data transaction_in_detail berdasarkan transaction_in_id
      const transactionDetails = await query(
        `SELECT transaction_in_detail.*,products.*  FROM transaction_in_detail LEFT JOIN products ON transaction_in_detail.product_id = products.product_id WHERE transaction_in_id = ?`,
        [id]
      );

      // Bandingkan dengan productList
      for (const transactionDetail of transactionDetails) {
        const productInList = productList.find(
          (product) => product.product_id === transactionDetail.product_id
        );

        // Jika produk tidak ada dalam productList
        if (!productInList) {
          // Hapus data transaction_in_detail
          await query(
            `DELETE FROM transaction_in_detail WHERE transaction_in_detail_id = ?`,
            [transactionDetail.transaction_in_detail_id]
          );

          // Periksa isExpired
          if (transactionDetail.isExpired == 1) {
            // Hapus data dari product_expired
            await query(
              `DELETE FROM product_expired WHERE transaction_in_id = ? AND product_id = ?`,
              [id, transactionDetail.product_id]
            );

            // Hitung total quantity di product_expired
            const totalExpiredQuantity = await query(
              `SELECT COALESCE(SUM(quantity), 0) AS total_quantity FROM product_expired WHERE product_id = ?`,
              [transactionDetail.product_id]
            );

            // Update stok di table products berdasarkan total quantity di product_expired
            await query(`UPDATE products SET stock = ? WHERE product_id = ?`, [
              totalExpiredQuantity[0].total_quantity,
              transactionDetail.product_id,
            ]);
          } else {
            // Update stok di table products berdasarkan quantity yang ada di transaction_in_detail
            await query(
              `UPDATE products SET stock = stock - ? WHERE product_id = ?`,
              [transactionDetail.quantity, transactionDetail.product_id]
            );
            // Hapus data transaction_in_detail
            await query(
              `DELETE FROM transaction_in_detail WHERE transaction_in_detail_id = ?`,
              [transactionDetail.transaction_in_detail_id]
            );
          }
        } else {
          // Jika produk ada dalam productList
          const price = productInList.product_price;
          const discount = productInList.product_discount || 0;
          const discountedPrice = price - price * (discount / 100);

          // Update data di tabel transaction_in_detail
          await query(
            `UPDATE transaction_in_detail 
              SET product_code = ?, 
                  batch_lot = ?, 
                  discount = ?, 
                  price = ?,
                  price_discount = ?
              WHERE product_id = ? and transaction_in_id = ?`,
            [
              productInList.product_code,
              productInList.batch_lot,
              productInList.product_discount,
              productInList.product_price,
              discountedPrice,
              productInList.product_id,
              productInList.transaction_in_id,
            ]
          );

          // Update data di tabel product_expired
          const expiredDate = new Date(productInList.expired_date);

          // Memformat tanggal menjadi 'YYYY-MM-DD HH:MM:SS'
          const formattedDate = expiredDate
            .toISOString()
            .replace("T", " ")
            .slice(0, 19);

          // Sekarang kita bisa menggunakan formattedDate dalam query
          await query(
            `UPDATE product_expired
    SET expired_date = ?
    WHERE product_id = ? and transaction_in_id = ?`,
            [
              formattedDate,
              productInList.product_id,
              productInList.transaction_in_id,
            ]
          );

          // Periksa perubahan quantity
          if (productInList.quantity !== transactionDetail.quantity) {
            // Kurangi stok lama di table products
            await query(
              `UPDATE products SET stock = stock - ? WHERE product_id = ?`,
              [transactionDetail.quantity, transactionDetail.product_id]
            );

            // Update stok baru di table products
            await query(
              `UPDATE products SET stock = IFNULL(stock, 0) + ? WHERE product_id = ?`,
              [productInList.quantity, transactionDetail.product_id]
            );

            await query(
              `UPDATE transaction_in_detail SET quantity = ? WHERE product_id = ? AND transaction_in_id = ?`,
              [
                parseInt(productInList.quantity),
                transactionDetail.product_id,
                id,
              ]
            );

            // Periksa isExpired
            if (transactionDetail.isExpired == 1) {
              // Update quantity di product_expired
              await query(
                `UPDATE product_expired SET quantity = ? WHERE transaction_in_id = ? AND product_id = ?`,
                [productInList.quantity, id, transactionDetail.product_id]
              );

              // Hitung total quantity di product_expired
              const totalExpiredQuantity = await query(
                `SELECT SUM(quantity) AS total_quantity FROM product_expired WHERE product_id = ?`,
                [transactionDetail.product_id]
              );
              // Update stok di table products berdasarkan total quantity di product_expired
              await query(
                `UPDATE products SET stock = ? WHERE product_id = ?`,
                [
                  totalExpiredQuantity[0].total_quantity,
                  transactionDetail.product_id,
                ]
              );
            }
          }
        }
      }

      // Cek jika ada produk baru dalam productList
      for (const productInList of productList) {
        const existingProduct = await query(
          `SELECT * FROM transaction_in_detail WHERE transaction_in_id = ? AND product_id = ?`,
          [id, productInList.product_id]
        );

        // Jika produk belum ada dalam transaction_in_detail
        if (!existingProduct.length) {
          // Tambahkan produk baru ke transaction_in_detail
          const productInfo = await query(
            `SELECT price,isExpired FROM products WHERE product_id = ?`,
            [productInList.product_id]
          );

          const price = productInList.product_price;
          const discount = productInList.product_discount || 0;
          const discountedPrice = price - price * (discount / 100);

          await query(
            `INSERT INTO transaction_in_detail (transaction_in_id, product_id, product_code, batch_lot, price, quantity, discount,price_discount) VALUES (?,?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              productInList.product_id,
              productInList.product_code,
              productInList.batch_lot,
              productInList.product_price,
              productInList.quantity,
              productInList.product_discount,
              discountedPrice,
            ]
          );

          // Periksa isExpired
          if (productInfo[0].isExpired == 1) {
            // Insert ke product_expired
            await query(
              `INSERT INTO product_expired (transaction_in_id, product_id, expired_date, quantity) VALUES (?, ?, ?, ?)`,
              [
                id,
                productInList.product_id,
                productInList.expired_date,
                productInList.quantity,
              ]
            );

            // Hitung total quantity di product_expired
            const totalExpiredQuantity = await query(
              `SELECT SUM(quantity) AS total_quantity FROM product_expired WHERE product_id = ?`,
              [productInList.product_id]
            );

            // Update stok di table products berdasarkan total quantity di product_expired
            await query(`UPDATE products SET stock = ? WHERE product_id = ?`, [
              totalExpiredQuantity[0].total_quantity,
              productInList.product_id,
            ]);
          } else {
            // Update stok di table products berdasarkan quantity baru
            await query(
              `UPDATE products SET stock = stock + ? WHERE product_id = ?`,
              [productInList.quantity, productInList.product_id]
            );
          }
        }
      }

      // Ambil semua detail transaksi berdasarkan transaction_in_id
      const transactionInDetails = await query(
        `SELECT * FROM transaction_in_detail WHERE transaction_in_id = ?`,
        [id]
      );

      // Inisialisasi variabel untuk total amount
      let amount = 0;

      // Iterasi melalui setiap detail transaksi
      for (const transactionDetailCheck of transactionInDetails) {
        // Ambil harga dan jumlah dari setiap produk

        const productPrice = transactionDetailCheck.price;
        const productQuantity = transactionDetailCheck.quantity;
        const productDiscount = transactionDetailCheck.discount || 0;

        // Hitung total jumlah untuk produk tersebut
        const productTotal = productPrice * productQuantity;

        // Hitung jumlah diskon untuk produk tersebut
        const discountAmount = (productTotal * productDiscount) / 100; // Diskon dalam persen

        // Kurangi jumlah diskon dari total produk
        const productTotalAfterDiscount = productTotal - discountAmount;

        // Tambahkan total jumlah produk setelah diskon ke dalam total amount
        amount += productTotalAfterDiscount;
      }

      // Hitung total amount berdasarkan pajak jika ada
      const totalAmount = tax ? amount + (amount * tax) / 100 : amount;
      const faktur = new Date(fakturDate);

      // Memformat tanggal menjadi 'YYYY-MM-DD HH:MM:SS'
      const formattedFakturDate = faktur
        .toISOString()
        .replace("T", " ")
        .slice(0, 19);

      // Update data transaction_in
      await query(
        `UPDATE transaction_in SET 
      no_faktur = ?,
      faktur_date = ?,
      note = ?,
      payment_method = ?,
      supplier_id = ?,
      tax = ?,
      time_to_payment = ?,
      amount = ?,
      amount_tax = ?,
      updated_at = ?,
      shipping_cost = ?
      WHERE transaction_in_id = ?`,
        [
          noFaktur,
          formattedFakturDate,
          note,
          paymentMethod,
          supplierId,
          tax,
          timeToPayment,
          amount,
          totalAmount,
          updatedDate,
          shippingCost,
          id,
        ]
      );

      return res
        .status(200)
        .send({ message: "Transaction data updated successfully" });
    } catch (error) {
      console.error("Update Transaction In Error:", error);
      await query("ROLLBACK");
      res.status(500).send({ message: error });
    }
  },
  transactionOutListCustomer: async (req, res) => {
    try {
      const { id } = req.params;
      const getTransactionOut = await query(
        `SELECT tro.*, c.customer_name , u.name ,s.sales_name
        FROM transaction_out  tro
        LEFT JOIN customers c ON c.customer_id = tro.customer_id
        LEFT JOIN user u ON u.user_id = tro.pic
        LEFT JOIN sales_team s ON s.sales_id = tro.salesman
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
  transactionOutList: async (req, res) => {
    try {
      const getTransactionOut = await query(
        `SELECT tro.*, c.customer_name , u.name ,s.sales_name
        FROM transaction_out  tro
        LEFT JOIN customers c ON c.customer_id = tro.customer_id
        LEFT JOIN user u ON u.user_id = tro.pic
        LEFT JOIN sales_team s ON s.sales_id = tro.salesman
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
        fakturDate,
        paymentMethod,
        productList,
        customerId,
        timeToPayment,
        deliveryDate,
        note,
        noPo,
        salesman,
        userId,
      } = req.body;

      const errors = [];

      if (!paymentMethod) {
        errors.push({
          field: "paymentMethod",
          message: "Payment Method is required",
        });
      }
      if (
        !productList ||
        !Array.isArray(productList) ||
        productList.length === 0
      ) {
        errors.push({
          field: "productList",
          message: "Product List is required",
        });
      }
      if (!customerId) {
        errors.push({
          field: "customerId",
          message: "Customer ID is required",
        });
      }
      if (!timeToPayment) {
        errors.push({
          field: "timeToPayment",
          message: "Time to Payment is required",
        });
      }

      if (!deliveryDate) {
        errors.push({
          field: "deliveryDate",
          message: "Delivery Date is required",
        });
      }

      if (errors.length > 0) {
        return res.status(400).send({ errors });
      }
      const createdDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      const insertTransactionOutResult = await query(
        `INSERT INTO transaction_out (no_faktur, faktur_date, no_po, salesman, note, payment_method, customer_id, time_to_payment, created_at, delivery_date, pic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          noFaktur,
          fakturDate,
          noPo,
          salesman,
          note,
          paymentMethod,
          customerId,
          timeToPayment,
          createdDate,
          deliveryDate,
          userId,
        ]
      );

      const transactionOutId = insertTransactionOutResult.insertId;

      for (const productItem of productList) {
        const {
          product_id,
          discount,
          qty,
          ppn,
          pph,
          productTotalPrice,
          price,
          cn,
          cn_type,
        } = productItem;

        // Check if the product is expired
        const productInfo = await query(
          `SELECT * FROM products WHERE product_id = ?`,
          [product_id]
        );

        let remainingQuantity = qty;

        if (productInfo[0].isExpired == 0) {
          // If not expired, directly reduce stock
          await query(
            `UPDATE products SET stock = stock - ? WHERE product_id = ?`,
            [qty, product_id]
          );
        } else {
          // If expired, find expired dates and reduce stock accordingly
          const expiredProducts = await query(
            `SELECT * FROM product_expired WHERE product_id = ? AND quantity > 0 ORDER BY expired_date ASC`,
            [product_id]
          );

          for (const expiredProduct of expiredProducts) {
            const { expired_date, quantity } = expiredProduct;

            if (quantity >= remainingQuantity) {
              // Reduce stock from this expired date
              await query(
                `UPDATE product_expired SET quantity = quantity - ? WHERE product_id = ? AND expired_date = ?`,
                [remainingQuantity, product_id, expired_date]
              );

              await query(
                `INSERT INTO transaction_product_expired (product_expired_id, quantity, transaction_out_id) VALUES (?, ?, ?)`,
                [
                  expiredProduct.product_expired_id,
                  remainingQuantity,
                  transactionOutId,
                ]
              );
              remainingQuantity = 0;
              break;
            } else {
              // Reduce stock and update remainingQuantity
              const actualQuantityReduced = Math.min(
                quantity,
                remainingQuantity
              );

              await query(
                `UPDATE product_expired SET quantity = 0 WHERE product_id = ? AND expired_date = ?`,
                [product_id, expired_date]
              );

              await query(
                `INSERT INTO transaction_product_expired (product_expired_id, quantity, transaction_out_id) VALUES (?, ?, ?)`,
                [
                  expiredProduct.product_expired_id,
                  actualQuantityReduced,
                  transactionOutId,
                ]
              );
              remainingQuantity -= quantity;
            }
          }

          // Update remaining quantity in main product table
          if (remainingQuantity > 0) {
            // If there's remaining quantity, update product table with negative stock
            await query(
              `UPDATE products SET stock = stock - ? WHERE product_id = ?`,
              [remainingQuantity, product_id]
            );
          } else {
            const totalStockQueryResult = await query(
              `SELECT SUM(quantity) AS totalStock FROM product_expired WHERE product_id = ?`,
              [product_id]
            );
            await query(`UPDATE products SET stock = ? WHERE product_id = ?`, [
              totalStockQueryResult[0].totalStock,
              product_id,
            ]);
          }
        }

        // Calculate amounts

        // const productDiscDecimal = parseFloat(discount) / 100;
        // const productPpnDecimal = parseFloat(ppn) / 100;
        // const productPphDecimal = parseFloat(pph) / 100;

        // Hitung amount
        // let amount;
        // if (!productDiscDecimal || productDiscDecimal === 0) {
        // Jika diskon null atau 0, hitung jumlah tanpa diskon
        // amount = productPrice * qty;
        // } else {
        // Jika diskon tidak null atau tidak 0, terapkan diskon
        //   amount = productPrice * qty * (1 - productDiscDecimal);
        // }
        // Hitung amountTax
        // const ResultPpn = productPpnDecimal * amount;
        // const ResultPph = productPphDecimal * amount;
        // const amountTax = amount + ResultPpn + ResultPph;
        // const amount = 0;
        // const amountTax = 0;

        // Insert into transaction_out_detail
        await query(
          `INSERT INTO transaction_out_detail (transaction_out_id, product_id, discount, qty, ppn, pph, amount_tax, product_price, cn , cn_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transactionOutId,
            product_id,
            discount,
            qty,
            ppn,
            pph,
            productTotalPrice,
            price,
            cn,
            cn_type,
          ]
        );
      }

      // Update amount and amount_tax in transaction_out table
      const updateTransactionOut = await query(
        `UPDATE transaction_out SET amount = (SELECT SUM(amount) FROM transaction_out_detail WHERE transaction_out_id = ?), amount_tax = (SELECT SUM(amount_tax) FROM transaction_out_detail WHERE transaction_out_id = ?) WHERE transaction_out_id = ?`,
        [transactionOutId, transactionOutId, transactionOutId]
      );

      await query(
        `UPDATE transaction_out_detail
     SET amount_cn = CASE 
       WHEN cn_type = 'Percentage' THEN (product_price * qty) * (cn / 100)
       WHEN cn_type = 'Nominal' THEN cn * qty
     END
     WHERE transaction_out_id = ?`,
        [transactionOutId]
      );

      // Calculate amount_cn and update in transaction_out table
      await query(
        `UPDATE transaction_out 
     SET amount_cn = (SELECT SUM(amount_cn) FROM transaction_out_detail WHERE transaction_out_id = ?) 
     WHERE transaction_out_id = ?`,
        [transactionOutId, transactionOutId]
      );

      return res
        .status(200)
        .send({ message: "Transaction created successfully" });
    } catch (error) {
      console.error("Error inserting transaction:", error);
      return res.status(500).send({ message: "Failed to insert transaction" });
    }
  },
  updateTransactionOut: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        noFaktur,
        fakturDate,
        paymentMethod,
        productList,
        customerId,
        timeToPayment,
        deliveryDate,
        note,
        noPo,
        salesman,
      } = req.body;
      const errors = [];

      if (!paymentMethod) {
        errors.push({
          field: "paymentMethod",
          message: "Payment Method is required",
        });
      }
      if (
        !productList ||
        !Array.isArray(productList) ||
        productList.length === 0
      ) {
        errors.push({
          field: "productList",
          message: "Product List is required",
        });
      }
      if (!customerId) {
        errors.push({
          field: "customerId",
          message: "Customer ID is required",
        });
      }
      if (!timeToPayment) {
        errors.push({
          field: "timeToPayment",
          message: "Time to Payment is required",
        });
      }

      if (!deliveryDate) {
        errors.push({
          field: "deliveryDate",
          message: "Delivery Date is required",
        });
      }

      if (errors.length > 0) {
        return res.status(400).send({ errors });
      }

      // Update transaction_out table
      const updateTransactionOutResult = await query(
        `UPDATE transaction_out SET 
        no_faktur = ?, 
        faktur_date = ?,
        no_po = ?, 
        salesman = ?, 
        note = ?, 
        payment_method = ?, 
        customer_id = ?, 
        time_to_payment = ?, 
        delivery_date = ?, 
        updated_at = CURRENT_TIMESTAMP 
      WHERE transaction_out_id = ?`,
        [
          noFaktur,
          fakturDate,
          noPo,
          salesman,
          note,
          paymentMethod,
          customerId,
          timeToPayment,
          deliveryDate,
          id,
        ]
      );

      // Ambil semua detail transaksi
      const transactionDetails = await query(
        `SELECT * FROM transaction_out_detail WHERE transaction_out_id = ?`,
        [id]
      );

      // Loop melalui setiap produk dalam detail transaksi
      for (const transactionDetail of transactionDetails) {
        const { product_id, qty, transaction_out_detail_id } =
          transactionDetail;

        // Periksa apakah produk ada dalam daftar produk yang dikirimkan
        const productExist = productList.find(
          (product) => product.product_id === product_id
        );

        const productInfo = await query(
          `SELECT * FROM products WHERE product_id = ?`,
          [product_id]
        );
        if (!productExist) {
          // Jika produk tidak ada dalam daftar produk yang dikirimkan

          if (productInfo[0].isExpired == 1) {
            // Jika produk kedaluwarsa
            const expiredProducts = await query(
              `SELECT * FROM transaction_product_expired WHERE transaction_out_id = ? AND quantity > 0 ORDER BY transaction_product_expired_id ASC`,
              [id]
            );
            for (const expiredProduct of expiredProducts) {
              const { expired_date, quantity, product_expired_id } =
                expiredProduct;

              // Tambahkan kuantitas kembali ke stok
              await query(
                `UPDATE product_expired SET quantity = quantity + ? WHERE product_expired_id = ?`,
                [quantity, product_expired_id]
              );

              // Hapus entri produk dari transaction_product_expired
              await query(
                `DELETE FROM transaction_product_expired WHERE transaction_out_id = ?`,
                [id]
              );

              await query(
                `DELETE FROM transaction_out_detail WHERE transaction_out_detail_id = ?`,
                [transaction_out_detail_id]
              );
            }

            // Hitung ulang total stok produk yang kedaluwarsa
            const totalStockQueryResult = await query(
              `SELECT SUM(quantity) AS totalStock FROM product_expired WHERE product_id = ?`,
              [product_id]
            );

            // Update stok produk
            await query(`UPDATE products SET stock = ? WHERE product_id = ?`, [
              totalStockQueryResult[0].totalStock,
              product_id,
            ]);
          } else {
            // Jika produk tidak kedaluwarsa, tambahkan stok langsung
            await query(
              `UPDATE products SET stock = stock + ? WHERE product_id = ?`,
              [qty, product_id]
            );

            await query(
              `DELETE FROM transaction_out_detail WHERE transaction_out_detail_id = ?`,
              [transaction_out_detail_id]
            );
          }
        } else {
          // Jika produk ada dalam daftar produk yang dikirimkan
          const { product_id, discount, qty, ppn, pph } = productExist;

          if (
            productExist.qty != transactionDetail.qty ||
            productExist.discount != transactionDetail.discount ||
            productExist.price != transactionDetail.product_price ||
            productExist.cn != transactionDetail.cn ||
            productExist.cn_type != transactionDetail.cn_type
          ) {
            // done expired
            if (productInfo[0].isExpired == 1) {
              let remainingQuantity = productExist.qty;
              // Jika produk kedaluwarsa
              const expiredProducts = await query(
                `SELECT * FROM transaction_product_expired WHERE transaction_out_id = ? AND quantity > 0 ORDER BY transaction_product_expired_id ASC`,
                [id]
              );

              for (const expiredProduct of expiredProducts) {
                const { expired_date, quantity, product_expired_id } =
                  expiredProduct;

                // Tambahkan kuantitas kembali ke stok
                await query(
                  `UPDATE product_expired SET quantity = quantity + ? WHERE product_expired_id = ?`,
                  [expiredProduct.quantity, product_expired_id]
                );

                // Hapus entri produk dari transaction_product_expired
                await query(
                  `DELETE FROM transaction_product_expired WHERE product_expired_id = ?`,
                  [product_expired_id]
                );

                await query(
                  `DELETE FROM transaction_out_detail WHERE transaction_out_detail_id = ?`,
                  [transaction_out_detail_id]
                );
              }

              // If expired, find expired dates and reduce stock accordingly
              const expiredProductDetails = await query(
                `SELECT * FROM product_expired WHERE product_id = ? AND quantity > 0 ORDER BY expired_date ASC`,
                [productExist.product_id]
              );

              for (const expiredProduct of expiredProductDetails) {
                const { expired_date, quantity } = expiredProduct;

                if (expiredProduct.quantity >= remainingQuantity) {
                  // Reduce stock from this expired date
                  await query(
                    `UPDATE product_expired SET quantity = quantity - ? WHERE product_id = ? AND expired_date = ?`,
                    [remainingQuantity, productExist.product_id, expired_date]
                  );

                  await query(
                    `INSERT INTO transaction_product_expired (product_expired_id, quantity, transaction_out_id) VALUES (?, ?, ?)`,
                    [expiredProduct.product_expired_id, remainingQuantity, id]
                  );
                  remainingQuantity = 0;
                  break;
                } else {
                  // Reduce stock and update remainingQuantity
                  const actualQuantityReduced = Math.min(
                    expiredProduct.quantity,
                    remainingQuantity
                  );

                  await query(
                    `UPDATE product_expired SET quantity = 0 WHERE product_id = ? AND expired_date = ?`,
                    [productExist.product_id, expired_date]
                  );

                  await query(
                    `INSERT INTO transaction_product_expired (product_expired_id, quantity, transaction_out_id) VALUES (?, ?, ?)`,
                    [
                      expiredProduct.product_expired_id,
                      actualQuantityReduced,
                      id,
                    ]
                  );
                  remainingQuantity -= expiredProduct.quantity;
                }
              }

              // Update remaining quantity in main product table
              if (remainingQuantity > 0) {
                // If there's remaining quantity, update product table with negative stock
                await query(
                  `UPDATE products SET stock = stock - ? WHERE product_id = ?`,
                  [remainingQuantity, productExist.product_id]
                );
              } else {
                const totalStockQueryResult = await query(
                  `SELECT SUM(quantity) AS totalStock FROM product_expired WHERE product_id = ?`,
                  [productExist.product_id]
                );
                await query(
                  `UPDATE products SET stock = ? WHERE product_id = ?`,
                  [totalStockQueryResult[0].totalStock, productExist.product_id]
                );
              }
              // Hitung ulang total stok produk yang kedaluwarsa
              const totalStockQueryResult = await query(
                `SELECT SUM(quantity) AS totalStock FROM product_expired WHERE product_id = ?`,
                [product_id]
              );

              // Update stok produk
              await query(
                `UPDATE products SET stock = ? WHERE product_id = ?`,
                [totalStockQueryResult[0].totalStock, product_id]
              );
              await query(
                `DELETE FROM transaction_out_detail WHERE transaction_out_detail_id = ?`,
                [transaction_out_detail_id]
              );
            } else {
              // clear
              // Jika produk tidak kedaluwarsa, tambahkan stok langsung
              await query(
                `UPDATE products SET stock = stock + ? WHERE product_id = ?`,
                [transactionDetail.qty, productExist.product_id]
              );

              await query(
                `UPDATE products SET stock = stock - ? WHERE product_id = ?`,
                [productExist.qty, productExist.product_id]
              );
              await query(
                `DELETE FROM transaction_out_detail WHERE transaction_out_detail_id = ?`,
                [transaction_out_detail_id]
              );
            }
            // const productPriceResult = await query(
            //   `SELECT price FROM products WHERE product_id = ?`,
            //   [productExist.product_id]
            // );

            // const productPrice =
            //   productPriceResult.length > 0 ? productPriceResult[0].price : 0;
            // const productDiscDecimal = parseFloat(productExist.discount) / 100;
            // const productPpnDecimal = parseFloat(productExist.ppn) / 100;
            // const productPphDecimal = parseFloat(productExist.pph) / 100;

            // let amount;
            // if (!productDiscDecimal || productDiscDecimal === 0) {
            //   amount = productPrice * productExist.qty;
            // } else {
            //   amount =
            //     productPrice * productExist.qty * (1 - productDiscDecimal);
            // }

            // const ppn = productPpnDecimal * amount;
            // const pph = productPphDecimal * amount;
            // const amountTax = amount + ppn + pph;

            await query(
              `INSERT INTO transaction_out_detail (transaction_out_id, product_id, discount, qty, ppn, pph, amount_tax, product_price, cn, cn_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id,
                productExist.product_id,
                productExist.discount,
                productExist.qty,
                productExist.ppn,
                productExist.pph,
                productExist.productTotalPrice,
                productExist.price,
                productExist.cn,
                productExist.cn_type,
              ]
            );
          }
          // Hitung amount
        }
      }

      // logic kalau ada product
      for (const product of productList) {
        const {
          product_id,
          discount,
          qty,
          pph,
          ppn,
          cn,
          cn_type,
          price,
          productTotalPrice,
        } = product;

        // Check if product exists in transaction details
        const existingProduct = transactionDetails.find(
          (detail) => detail.product_id === product_id
        );
        const productPriceResult = await query(
          `SELECT price FROM products WHERE product_id = ?`,
          [product_id]
        );

        const productPrice =
          productPriceResult.length > 0 ? productPriceResult[0].price : 0;
        if (!existingProduct) {
          // Check if the product is expired
          const productInfo = await query(
            `SELECT * FROM products WHERE product_id = ?`,
            [product_id]
          );
          let remainingQuantity = qty;
          if (productInfo[0].isExpired == 0) {
            // If not expired, directly reduce stock
            await query(
              `UPDATE products SET stock = stock - ? WHERE product_id = ?`,
              [qty, product_id]
            );
          } else {
            // If expired, find expired dates and reduce stock accordingly
            const expiredProducts = await query(
              `SELECT * FROM product_expired WHERE product_id = ? AND quantity > 0 ORDER BY expired_date ASC`,
              [product_id]
            );

            for (const expiredProduct of expiredProducts) {
              const { expired_date, quantity } = expiredProduct;

              if (quantity >= remainingQuantity) {
                // Reduce stock from this expired date
                await query(
                  `UPDATE product_expired SET quantity = quantity - ? WHERE product_id = ? AND expired_date = ?`,
                  [remainingQuantity, product_id, expired_date]
                );

                await query(
                  `INSERT INTO transaction_product_expired (product_expired_id, quantity, transaction_out_id) VALUES (?, ?, ?)`,
                  [expiredProduct.product_expired_id, remainingQuantity, id]
                );
                remainingQuantity = 0;
                break;
              } else {
                // Reduce stock and update remainingQuantity
                const actualQuantityReduced = Math.min(
                  quantity,
                  remainingQuantity
                );

                await query(
                  `UPDATE product_expired SET quantity = 0 WHERE product_id = ? AND expired_date = ?`,
                  [product_id, expired_date]
                );

                await query(
                  `INSERT INTO transaction_product_expired (product_expired_id, quantity, transaction_out_id) VALUES (?, ?, ?)`,
                  [expiredProduct.product_expired_id, actualQuantityReduced, id]
                );
                remainingQuantity -= quantity;
              }
            }

            // Update remaining quantity in main product table
            if (remainingQuantity > 0) {
              // If there's remaining quantity, update product table with negative stock
              await query(
                `UPDATE products SET stock = stock - ? WHERE product_id = ?`,
                [remainingQuantity, product_id]
              );
            } else {
              const totalStockQueryResult = await query(
                `SELECT SUM(quantity) AS totalStock FROM product_expired WHERE product_id = ?`,
                [product_id]
              );
              await query(
                `UPDATE products SET stock = ? WHERE product_id = ?`,
                [totalStockQueryResult[0].totalStock, product_id]
              );
            }
          }
          // const productDiscDecimal = parseFloat(discount) / 100;
          // const productPpnDecimal = parseFloat(ppn) / 100;
          // const productPphDecimal = parseFloat(pph) / 100;

          // let amount;
          // if (!productDiscDecimal || productDiscDecimal === 0) {
          //   amount = productPrice * qty;
          // } else {
          //   amount = productPrice * qty * (1 - productDiscDecimal);
          // }

          // const ResultPpn = productPpnDecimal * amount;
          // const ResultPph = productPphDecimal * amount;
          // const amountTax = amount + ResultPpn + ResultPph;

          await query(
            `INSERT INTO transaction_out_detail (transaction_out_id, product_id, discount, qty, ppn, pph, amount_tax, product_price,cn,cn_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              product_id,
              discount,
              qty,
              ppn,
              pph,
              productTotalPrice,
              price,
              cn,
              cn_type,
            ]
          );
        }
      }

      // Hitung ulang jumlah dan jumlah pajak transaksi
      const updateTransactionOut = await query(
        `UPDATE transaction_out 
      SET amount = (SELECT SUM(amount) FROM transaction_out_detail WHERE transaction_out_id = ?), 
      amount_tax = (SELECT SUM(amount_tax) FROM transaction_out_detail WHERE transaction_out_id = ?) 
      WHERE transaction_out_id = ?`,
        [id, id, id]
      );

      await query(
        `UPDATE transaction_out_detail
     SET amount_cn = CASE 
       WHEN cn_type = 'Percentage' THEN (product_price * qty) * (cn / 100)
       WHEN cn_type = 'Nominal' THEN cn * qty
     END
     WHERE transaction_out_id = ?`,
        [id]
      );

      // Calculate amount_cn and update in transaction_out table
      await query(
        `UPDATE transaction_out 
     SET amount_cn = (SELECT SUM(amount_cn) FROM transaction_out_detail WHERE transaction_out_id = ?) 
     WHERE transaction_out_id = ?`,
        [id, id]
      );
      // Berhasil
      return res
        .status(200)
        .send({ message: "Transaction updated successfully" });
    } catch (error) {
      console.error("Error updating transaction:", error);
      return res.status(500).send({ message: "Failed to update transaction" });
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
        tod.cn_type,
        tod.product_price as price,
        tod.amount,
        tod.amount_tax,
        c.customer_name,
        p.product_name,
        pt.type_name,
        pm.merk_name,
        p.akl_akd
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
        `SELECT t_out.* , u.name FROM transaction_out as t_out
          LEFT JOIN
        user AS u ON u.user_id = t_out.pic 
         WHERE transaction_out_id = ${id}`
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
    }
  },
  transactionReport: async (req, res) => {
    try {
      const transactionOutData = await query(
        `SELECT
    all_months.month AS month,
    COUNT(transaction_out.created_at) AS transaction_count
FROM
    (
        SELECT 1 AS month UNION ALL
        SELECT 2 UNION ALL
        SELECT 3 UNION ALL
        SELECT 4 UNION ALL
        SELECT 5 UNION ALL
        SELECT 6 UNION ALL
        SELECT 7 UNION ALL
        SELECT 8 UNION ALL
        SELECT 9 UNION ALL
        SELECT 10 UNION ALL
        SELECT 11 UNION ALL
        SELECT 12
    ) AS all_months
LEFT JOIN transaction_out ON MONTH(transaction_out.created_at) = all_months.month
GROUP BY
    all_months.month
ORDER BY
    all_months.month;
        `
      );

      const transactionInData = await query(
        `SELECT
        all_months.month AS month,
        COUNT(transaction_in.created_at) AS transaction_count
      FROM
        (
          SELECT 1 AS month UNION ALL
          SELECT 2 UNION ALL
          SELECT 3 UNION ALL
          SELECT 4 UNION ALL
          SELECT 5 UNION ALL
          SELECT 6 UNION ALL
          SELECT 7 UNION ALL
          SELECT 8 UNION ALL
          SELECT 9 UNION ALL
          SELECT 10 UNION ALL
          SELECT 11 UNION ALL
          SELECT 12
        ) AS all_months
      LEFT JOIN transaction_in ON MONTH(transaction_in.created_at) = all_months.month
      GROUP BY
        all_months.month
      ORDER BY
        all_months.month;
      `
      );

      const transactionCountByMonthIn = new Array(12).fill(0);

      transactionInData.forEach((transaction) => {
        const monthIndex = transaction.month - 1;
        transactionCountByMonthIn[monthIndex] = transaction.transaction_count;
      });
      const transactionCountByMonthOut = new Array(12).fill(0);

      transactionOutData.forEach((transaction) => {
        const monthIndex = transaction.month - 1;
        transactionCountByMonthOut[monthIndex] = transaction.transaction_count;
      });
      return res.status(200).send({
        message: "Get All Transaction  Data Success",
        data: {
          transactionIn: transactionCountByMonthIn,
          transactionOut: transactionCountByMonthOut,
        },
      });
    } catch (error) {
      console.error("All Transaction In Error:", error);
      res.status(500).send({ message: error });
    }
  },
};
