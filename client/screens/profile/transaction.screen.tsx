import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import useUser from "@/hooks/auth/useUser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Loader from "@/components/loader/loader";

interface Transaction {
  orderId: string;
  courseId: string;
  courseName: string;
  amount: number;
  paymentId: string;
  status: string;
  createdAt: string;
  courseDescription: string;
  estimatedPrice: number;
  thumbnail: string;
  tags: string;
  level: string;
}

export default function InvoiceGeneratorScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: userLoading, error: userError } = useUser();

  useEffect(() => {
    if (user && !userLoading) {
      fetchTransactions();
    }
  }, [user, userLoading]);

  const fetchTransactions = async () => {
    if (!user || !user._id) {
      Alert.alert("Error", "User information not available");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `${SERVER_URI}/transaction/user/${user._id}`,
        {
          headers: {
            "access-token": await AsyncStorage.getItem("access_token"),
            "refresh-token": await AsyncStorage.getItem("refresh_token"),
          },
        }
      );

      if (response.data.success) {
        setTransactions(response.data.transactionHistory);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch transactions"
        );
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      Alert.alert("Error", "Failed to fetch transaction history");
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceHtml = (transaction: Transaction) => {
    const invoiceDate = new Date(transaction.createdAt).toLocaleDateString();
    const companyName = "Gyanoda";
    const companyAddress =
      "218, Basudevpur Road Saratpally Shyamnagar Pin:-743127 West Bengal, India";
    const companyPhone = "+919073963347";
    const companyEmail = "support@gyanoda.com";
    const companyLogoUrl =
      "https://res.cloudinary.com/dv9h1noz9/image/upload/v1725727334/pamg8mftyshstqe1whay.png";
    const watermarkImageUrl =
      "https://res.cloudinary.com/dv9h1noz9/image/upload/v1727549021/vecteezy_confirmation-and-approval-of-order-operation-payment_35202185_j6btqt.jpg";

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice for ${transaction.courseName}</title>
      <style>
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          color: #333;
          background-color: #fff;
          margin: 0;
          padding: 0;
        }
        .invoice-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          box-sizing: border-box;
          position: relative;
        }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.1;
          z-index: -1;
          width: 70%;
          height: auto;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .company-logo {
          width: 100px;
          height: auto;
        }
        .invoice-title {
          font-size: 24px;
          font-weight: bold;
          color: #3498db;
        }
        .company-details, .customer-details {
          font-size: 12px;
          margin-bottom: 15px;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #3498db;
          margin-bottom: 5px;
        }
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          font-size: 12px;
        }
        .invoice-table th, .invoice-table td {
          padding: 8px;
          border-bottom: 1px solid #ddd;
          text-align: left;
        }
        .invoice-table th {
          background-color: #3498db;
          color: #fff;
        }
        .total-row {
          font-weight: bold;
        }
        .additional-info {
          margin-top: 15px;
          font-size: 12px;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #7f8c8d;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <img src="${watermarkImageUrl}" alt="Success Watermark" class="watermark" />
        
        <div class="invoice-header">
          <img src="${companyLogoUrl}" alt="Company Logo" class="company-logo" />
          <div class="invoice-title">Invoice</div>
        </div>

        <div class="company-details">
          <div class="section-title">From:</div>
          <div>${companyName}</div>
          <div>${companyAddress}</div>
          <div>Phone: ${companyPhone}</div>
          <div>Email: ${companyEmail}</div>
        </div>

        <div class="customer-details">
          <div class="section-title">To:</div>
          <div>${user?.name || "Valued Customer"}</div>
          <div>Email: ${user?.email || "N/A"}</div>
          <div>Order ID: ${transaction.orderId}</div>
          <div>Payment ID: ${transaction.paymentId}</div>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${transaction.courseName}</td>
              <td>${transaction.courseDescription}</td>
              <td>₹${transaction.amount.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2">Total</td>
              <td>₹${transaction.amount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="additional-info">
          <div class="section-title">Additional Information:</div>
          <div>Date: ${invoiceDate}</div>
          <div>Status: ${transaction.status}</div>
          <div>Payment Method: Online Payment</div>
          <div>Course Level: ${transaction.level}</div>
          <div>Tags: ${transaction.tags}</div>
        </div>

        <div class="footer">
          Thank you for choosing Gyanoda for your learning journey!
        </div>
      </div>
    </body>
    </html>
  `;
  };

  const handleDownloadInvoice = async (transaction: Transaction) => {
    try {
      const invoiceHtml = generateInvoiceHtml(transaction);
      const { uri } = await Print.printToFileAsync({
        html: invoiceHtml,
        base64: false,
      });

      const filename = `${transaction.courseName.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}_Invoice.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.copyAsync({
        from: uri,
        to: fileUri,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          UTI: ".pdf",
          mimeType: "application/pdf",
          dialogTitle: `Invoice for ${transaction.courseName}`,
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }

      // Clean up the temporary file
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (error) {
      console.error("Error generating invoice:", error);
      Alert.alert(
        "Error",
        "Failed to generate invoice. Please try again later."
      );
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.courseInfo}>
        <Text style={styles.courseName}>{item.courseName}</Text>
        <Text style={styles.transactionDate}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
        <Text style={styles.courseLevel}>Level: {item.level}</Text>
        <Text style={styles.courseTags}>Tags: {item.tags}</Text>
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionAmount}>₹{item.amount.toFixed(2)}</Text>
        <Text
          style={[
            styles.transactionStatus,
            { color: item.status === "Completed" ? "#4CAF50" : "#FFC107" },
          ]}
        >
          {item.status}
        </Text>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => handleDownloadInvoice(item)}
        >
          <Text style={styles.downloadButtonText}>Download Invoice</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (userLoading || loading) {
    return <Loader />;
  }

  if (userError) {
    return (
      <View style={styles.errorContainer}>
        <Text>Error: {userError}</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={styles.container}>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.orderId}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text>No transactions found.</Text>
          </View>
        )}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  transactionCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  transactionDate: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  courseLevel: {
    fontSize: 14,
    color: "#757575",
    marginTop: 2,
  },
  courseTags: {
    fontSize: 14,
    color: "#757575",
    marginTop: 2,
  },
  transactionInfo: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007BFF",
  },
  transactionStatus: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  downloadButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  downloadButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});
