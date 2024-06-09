const { pool, query } = require("../database");
const moment = require("moment-timezone");
const env = process.env;

module.exports = {
  all: async (req, res) => {
    try {
      const getProducts =
        await query(`SELECT p.*,pt.type_name,pm.merk_name,s.supplier_code, COALESCE(SUM(pe.quantity), 0) AS total_stock FROM products p
      LEFT JOIN product_type pt on pt.product_type_id = p.product_type
      LEFT JOIN product_merk pm on pm.product_merk_id = p.product_merk
      LEFT JOIN product_expired pe ON pe.product_id = p.product_id
      LEFT JOIN suppliers s ON s.supplier_id = p.supplier_id
      GROUP BY p.product_id
      ORDER BY p.created_at DESC
      `);

      return res.status(200).send({
        message: "Get Products Data Success",
        data: getProducts,
      });
    } catch (error) {
      console.error("Products All Error:", error);
      res.status(500).send({ message: error });
    }
  },
  master: async (req, res) => {
    try {
      const countTotalProduct = await query(
        `SELECT COUNT(*) AS totalProduct FROM products`
      );

      const countTotalProductType = await query(
        `SELECT COUNT(*) AS totalProductType FROM product_type`
      );
      const countTotalProductMerk = await query(
        `SELECT COUNT(*) AS totalProductMerk FROM product_merk`
      );
      const mostStockProduct = await query(
        `SELECT product_name
FROM products
ORDER BY stock DESC
LIMIT 1;
`
      );

      return res.status(200).send({
        message: "Get Product Master Data Success",
        data: {
          totalProduct: countTotalProduct[0].totalProduct,
          totalProductMerk: countTotalProductMerk[0].totalProductMerk,
          totalProductType: countTotalProductType[0].totalProductType,
          mostStockProduct: mostStockProduct[0].product_name,
        },
      });
    } catch (error) {
      console.error("Product Master  All Error:", error);
      res.status(500).send({ message: error });
    }
  },
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).send({ message: "ID is required" });
      }

      const result = await query(`DELETE FROM products WHERE product_id = ?`, [
        id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "Product not found" });
      }

      return res.status(200).send({
        message: "Product deleted successfully",
        deletedId: id,
      });
    } catch (error) {
      console.error("Delete Product Error:", error);
      return res.status(500).send({ message: "Failed to delete Product" });
    }
  },
  create: async (req, res) => {
    try {
      const {
        name,
        aklAkd,
        expired,
        supplierId,
        price,
        stock,
        productType,
        productMerk,
      } = req.body;

      const supplier = await query(
        `SELECT supplier_code FROM suppliers WHERE supplier_id = ?`,
        [supplierId]
      );

      if (supplier.length === 0) {
        return res.status(400).send({
          message: "Supplier not found",
        });
      }

      const supplierCode = supplier[0].supplier_code;

      const lastProduct = await query(
        `SELECT product_id FROM products WHERE product_id LIKE ? ORDER BY product_id DESC LIMIT 1`,
        [`${supplierCode}-%`]
      );

      let newProductId;
      if (lastProduct.length === 0) {
        // Jika tidak ada produk sebelumnya, mulai dari 1
        newProductId = `${supplierCode}-001`;
      } else {
        // Ambil nomor urut terakhir dan tambahkan 1
        const lastProductId = lastProduct[0].product_id;
        const lastNumber = parseInt(lastProductId.split("-")[1]);
        const newNumber = lastNumber + 1;
        const paddedNumber = String(newNumber).padStart(3, "0");
        newProductId = `${supplierCode}-${paddedNumber}`;
      }

      const createdDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      const errors = [];
      if (!name) {
        errors.push({ field: "name", message: "Name is required" });
      }

      if (!price) {
        errors.push({ field: "price", message: "Price is required" });
      }

      if (errors.length > 0) {
        return res.status(400).send({ errors });
      }

      const result = await query(
        `INSERT INTO products (product_id, product_name, product_type, product_merk, akl_akd, price, stock , isExpired, supplier_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newProductId,
          name,
          productType,
          productMerk,
          aklAkd,
          price,
          stock,
          expired,
          supplierId,
          createdDate,
        ]
      );

      return res.status(200).send({
        message: "Product created successfully",
        data: result[0],
      });
    } catch (error) {
      console.error("Create Product Error:", error);
      return res
        .status(500)
        .send({ message: error.message || "Failed to create Product" });
    }
  },
  allCreate: async (req, res) => {
    try {
      const { productList } = req.body;

      const errors = [];
      const results = [];

      for (const product of productList) {
        const {
          product_name,
          akl_akd,
          product_expired,
          supplier,
          price,
          stock,
          product_type,
          product_merk,
        } = product;

        const supplierResult = await query(
          `SELECT supplier_code FROM suppliers WHERE supplier_id = ?`,
          [supplier]
        );

        if (supplierResult.length === 0) {
          errors.push({
            field: "supplier",
            message: "Supplier not found",
            product,
          });
          continue;
        }

        const supplierCode = supplierResult[0].supplier_code;

        const lastProduct = await query(
          `SELECT product_id FROM products WHERE product_id LIKE ? ORDER BY product_id DESC LIMIT 1`,
          [`${supplierCode}-%`]
        );

        let newProductId;
        if (lastProduct.length === 0) {
          newProductId = `${supplierCode}-001`;
        } else {
          const lastProductId = lastProduct[0].product_id;
          const lastNumber = parseInt(lastProductId.split("-")[1]);
          const newNumber = lastNumber + 1;
          const paddedNumber = String(newNumber).padStart(3, "0");
          newProductId = `${supplierCode}-${paddedNumber}`;
        }

        const createdDate = moment
          .tz("Asia/Jakarta")
          .format("YYYY-MM-DD HH:mm:ss");

        if (!product_name) {
          errors.push({
            field: "product_name",
            message: "Product name is required",
            product,
          });
          continue;
        }

        if (!price) {
          errors.push({
            field: "price",
            message: "Price is required",
            product,
          });
          continue;
        }

        const result = await query(
          `INSERT INTO products (product_id, product_name, product_type, product_merk, akl_akd, price, stock , isExpired, supplier_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newProductId,
            product_name,
            product_type,
            product_merk,
            akl_akd,
            price,
            stock,
            product_expired,
            supplier,
            createdDate,
          ]
        );

        results.push(result);
      }

      if (errors.length > 0) {
        return res.status(400).send({ errors });
      }

      return res.status(200).send({
        message: "Products created successfully",
        data: results,
      });
    } catch (error) {
      console.error("Create Product Error:", error);
      return res
        .status(500)
        .send({ message: error.message || "Failed to create Product" });
    }
  },
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, aklAkd, expired, price, stock, productType, productMerk } =
        req.body;
      const updatedDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      const errors = [];
      if (!id) {
        errors.push({ field: "id", message: "ID is required" });
      }
      if (!name) {
        errors.push({ field: "name", message: "Name is required" });
      }

      if (!expired) {
        // Perbaikan disini: expired harus dicek, bukan expiredDate
        errors.push({
          field: "expired",
          message: "Expired is required",
        });
      }
      if (!price) {
        errors.push({ field: "price", message: "Price is required" });
      }

      if (errors.length > 0) {
        return res.status(400).send({ errors });
      }

      // Cek apakah stock tidak null atau undefined
      if (stock !== null && stock !== undefined) {
        const updateProduct = await query(
          `UPDATE products 
        SET product_name = ?, product_type  = ?, product_merk  = ?, akl_akd  = ?, price  = ?, stock  = ? , isExpired  = ?  , updated_at = ?
        WHERE product_id = ?`,
          [
            name,
            productType,
            productMerk,
            aklAkd,
            price,
            stock,
            expired,
            updatedDate,
            id,
          ]
        );

        if (updateProduct.affectedRows === 0) {
          return res.status(404).send({ message: "Product not found" });
        }
      } else {
        // Jika stock null, hanya melakukan update untuk atribut lainnya
        const updateProductWithoutStock = await query(
          `UPDATE products 
        SET product_name = ?, product_type  = ?, product_merk  = ?, akl_akd  = ?, price  = ?, isExpired  = ?  , updated_at = ?
        WHERE product_id = ?`,
          [
            name,
            productType,
            productMerk,
            aklAkd,
            price,
            expired,
            updatedDate,
            id,
          ]
        );

        if (updateProductWithoutStock.affectedRows === 0) {
          return res.status(404).send({ message: "Product not found" });
        }
      }

      return res.status(200).send({
        message: "Product updated successfully",
      });
    } catch (error) {
      console.error("Product Update Error:", error);
      res.status(500).send({ message: "Failed to update Product" });
    }
  },
  detail: async (req, res) => {
    try {
      const { id } = req.params;
      const getProduct = await query(
        `SELECT * FROM products
        WHERE product_id = "${id}"
        `
      );

      return res.status(200).send({
        message: "Get Product Detail Success",
        data: getProduct[0],
      });
    } catch (error) {
      console.error("Product Detail Error:", error);
      res.status(500).send({ message: error });
    }
  },
  allType: async (req, res) => {
    try {
      const getProductype = await query(`SELECT * FROM product_type
      ORDER BY created_at DESC
      `);

      return res.status(200).send({
        message: "Get Products Type Data Success",
        data: getProductype,
      });
    } catch (error) {
      console.error("Products Type All Error:", error);
      res.status(500).send({ message: error });
    }
  },
  createType: async (req, res) => {
    try {
      const { typeName } = req.body;

      const errors = [];
      if (!typeName) {
        errors.push({ field: "name", message: "Name is required" });
      }

      if (errors.length > 0) {
        return res.status(400).send({ errors });
      }

      const createdDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      const result = await query(
        `INSERT INTO product_type (type_name, created_at) VALUES (?, ?)`,
        [typeName, createdDate]
      );

      return res.status(200).send({
        message: "Product Type created successfully",
      });
    } catch (error) {
      console.error("Product Type All Error:", error);
      res.status(500).send({ message: error });
    }
  },
  detailType: async (req, res) => {
    try {
      const { id } = req.params;
      const getProductype = await query(
        `SELECT * FROM product_type
        WHERE product_type_id = ${id}
        `
      );

      return res.status(200).send({
        message: "Get Product Type Detail Success",
        data: getProductype[0],
      });
    } catch (error) {
      console.error("Product Type Detail Error:", error);
      res.status(500).send({ message: error });
    }
  },
  updateType: async (req, res) => {
    try {
      const { id } = req.params;
      const { typeName } = req.body;
      const updatedDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");
      const errors = [];
      if (!typeName) {
        errors.push({
          field: "name",
          message: "Product Type Name is required",
        });
      }
      if (errors.length > 0) {
        return res.status(400).send({ errors });
      }
      const updateProductType = await query(
        `UPDATE product_type 
       SET type_name = ? , updated_at = ?
       WHERE product_type_id = ?`,
        [typeName, updatedDate, id]
      );

      if (updateProductType.affectedRows === 0) {
        return res.status(404).send({ message: "Product Type not found" });
      }

      return res.status(200).send({
        message: "Product Type updated successfully",
      });
    } catch (error) {
      console.error("Product Type Update Error:", error);
      res.status(500).send({ message: "Failed to update Product Type" });
    }
  },
  deleteType: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).send({ message: "ID is required" });
      }

      const result = await query(
        `DELETE FROM product_type WHERE product_type_id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "Product Type not found" });
      }

      return res.status(200).send({
        message: "Product Type deleted successfully",
        deletedId: id,
      });
    } catch (error) {
      console.error("Delete Product Type Error:", error);
      return res.status(500).send({ message: "Failed to delete Product Type" });
    }
  },
  allMerk: async (req, res) => {
    try {
      const getProducMerk = await query(`SELECT * FROM product_merk
      ORDER BY created_at DESC
      `);

      return res.status(200).send({
        message: "Get Products Merk Data Success",
        data: getProducMerk,
      });
    } catch (error) {
      console.error("Products Merk All Error:", error);
      res.status(500).send({ message: error });
    }
  },
  createMerk: async (req, res) => {
    try {
      const { merkName } = req.body;

      const errors = [];
      if (!merkName) {
        errors.push({ field: "name", message: "Name is required" });
      }

      if (errors.length > 0) {
        return res.status(400).send({ errors });
      }

      const createdDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      const result = await query(
        `INSERT INTO product_merk (merk_name, created_at) VALUES (?, ?)`,
        [merkName, createdDate]
      );

      return res.status(200).send({
        message: "Product Merk created successfully",
      });
    } catch (error) {
      console.error("Product Merk All Error:", error);
      res.status(500).send({ message: error });
    }
  },
  detailMerk: async (req, res) => {
    try {
      const { id } = req.params;
      const getProductMerk = await query(
        `SELECT * FROM product_merk
        WHERE product_merk_id = ${id}
        `
      );

      return res.status(200).send({
        message: "Get Product Merk Detail Success",
        data: getProductMerk[0],
      });
    } catch (error) {
      console.error("Product Merk Detail Error:", error);
      res.status(500).send({ message: error });
    }
  },
  updateMerk: async (req, res) => {
    try {
      const { id } = req.params;
      const { merkName } = req.body;
      const updatedDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");
      const errors = [];
      if (!merkName) {
        errors.push({
          field: "name",
          message: "Product Merk Name is required",
        });
      }
      if (errors.length > 0) {
        return res.status(400).send({ errors });
      }
      const updateProductMerk = await query(
        `UPDATE product_merk
       SET merk_name = ? , updated_at = ?
       WHERE product_merk_id = ?`,
        [merkName, updatedDate, id]
      );

      if (updateProductMerk.affectedRows === 0) {
        return res.status(404).send({ message: "Product Merk not found" });
      }
      return res.status(200).send({
        message: "Product Merk updated successfully",
      });
    } catch (error) {
      console.error("Product Merk Update Error:", error);
      res.status(500).send({ message: "Failed to update Product Merk" });
    }
  },
  deleteMerk: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).send({ message: "ID is required" });
      }

      const result = await query(
        `DELETE FROM product_merk WHERE product_merk_id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "Product Merk not found" });
      }

      return res.status(200).send({
        message: "Product Merk deleted successfully",
        deletedId: id,
      });
    } catch (error) {
      console.error("Delete Product Merk Error:", error);
      return res.status(500).send({ message: "Failed to delete Product Type" });
    }
  },
  productExpiredDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const getProductExpired =
        await query(`SELECT * FROM product_expired  WHERE product_id = "${id}"
      ORDER BY expired_date DESC
      `);

      return res.status(200).send({
        message: "Get Products Expired Data Success",
        data: getProductExpired,
      });
    } catch (error) {
      console.error("Products Expired All Error:", error);
      res.status(500).send({ message: error });
    }
  },
  productSupplier: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(id);
      if (!id) {
        return res.status(400).send({ message: "Supplier ID is required" });
      }
      const masterProduct = await query(
        `SELECT product_id,product_name,price,stock,isExpired FROM products WHERE supplier_id = ${id}`
      );

      return res.status(200).send({
        message: "Get Master Dynamic Transaction Data Success",
        data: {
          product: masterProduct,
        },
      });
    } catch (error) {
      console.error("Master Dynamic Transaction Error:", error);
      res.status(500).send({ message: error });
    }
  },
};
