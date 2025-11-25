import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Colors } from '@/src/constants/colors';

interface InvoiceCardProps {
  transaction: any;
  onImagePress?: (imageUrl: string) => void;
}

export default function InvoiceCard({ transaction, onImagePress }: InvoiceCardProps) {
  const invoiceRef = useRef<ViewShot>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const generateInvoiceNumber = (transactionId: string) => {
    const date = new Date(transaction.approvedAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const shortId = transactionId.slice(-6).toUpperCase();
    return `INV-${year}${month}-${shortId}`;
  };

  const handleShare = async () => {
    try {
      if (!invoiceRef.current) {
        Alert.alert('Error', 'Invoice not ready. Please try again.');
        return;
      }

      // Capture the invoice as image
      const uri = await invoiceRef.current.capture();

      if (!uri) {
        Alert.alert('Error', 'Failed to capture invoice.');
        return;
      }

      // Check if sharing is available
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // Share directly from the captured URI
      await Sharing.shareAsync(uri, {
        dialogTitle: 'Share Invoice',
        mimeType: 'image/png',
        UTI: 'public.png',
      });
    } catch (error: any) {
      console.error('Error sharing invoice:', error);
      Alert.alert('Error', `Failed to share invoice: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <View style={styles.container}>
      <ViewShot ref={invoiceRef} options={{ format: 'png', quality: 1.0 }}>
        <View style={styles.invoiceCard}>
          {/* Invoice Header */}
          <View style={styles.invoiceHeader}>
            <View>
              <Text style={styles.invoiceTitle}>PURCHASE INVOICE</Text>
              <Text style={styles.invoiceNumber}>
                {generateInvoiceNumber(transaction._id)}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.statusText}>PAID</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Invoice Details */}
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Invoice Date</Text>
                <Text style={styles.value}>{formatDateTime(transaction.approvedAt)}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Period</Text>
                <Text style={styles.value}>
                  {formatDate(transaction.startDate)} - {formatDate(transaction.endDate)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Customer Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color={Colors.textLight} />
              <Text style={styles.infoText}>{transaction.userName || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color={Colors.textLight} />
              <Text style={styles.infoText}>{transaction.userPhoneNumber || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Items/Seeds Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Purchase Details</Text>
            <View style={styles.itemsTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Description</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Value</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Seeds Count</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                  {transaction.seedsCount?.toLocaleString() || '0'}
                </Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Seed Type</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                  {transaction.seedType || 'None'}
                </Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Bonus</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                  {transaction.bonus?.toLocaleString() || '0'}
                </Text>
              </View>

              <View style={[styles.tableRow, styles.totalRow]}>
                <Text style={[styles.totalLabel, { flex: 2 }]}>Total Price</Text>
                <Text style={[styles.totalValue, { flex: 1, textAlign: 'right' }]}>
                  ₹{transaction.price?.toLocaleString() || '0'}
                </Text>
              </View>
            </View>
          </View>

          {/* Approved Images */}
          {transaction.approvedImages && transaction.approvedImages.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Approved Images ({transaction.approvedImages.length})</Text>
                <View style={styles.imagesGrid}>
                  {transaction.approvedImages.map((img: any, idx: number) => (
                    <Pressable
                      key={idx}
                      onPress={() => onImagePress?.(img.url)}
                      style={styles.imageContainer}
                    >
                      <Image
                        source={{ uri: img.url }}
                        style={styles.imageThumb}
                        resizeMode="cover"
                      />
                      <Text style={styles.imageLabel}>#{idx + 1}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Footer */}
          <View style={styles.divider} />
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Approved by: {transaction.approvedByName || 'Admin'}
            </Text>
            <Text style={styles.footerText}>
              Date: {formatDateTime(transaction.approvedAt)}
            </Text>
          </View>
        </View>
      </ViewShot>

      {/* Action Button */}
      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} color={Colors.white} />
          <Text style={styles.actionButtonText}>Share Invoice</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  invoiceCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  invoiceNumber: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  section: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: Colors.textLight,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
  },
  itemsTable: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableCell: {
    fontSize: 14,
    color: Colors.text,
  },
  totalRow: {
    backgroundColor: '#f9fafb',
    borderBottomWidth: 0,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  imagesGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  imageContainer: {
    alignItems: 'center',
  },
  imageThumb: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  imageLabel: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 4,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  footerText: {
    fontSize: 11,
    color: Colors.textLight,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});
