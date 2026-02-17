import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrderPdfProps {
    order: any;
}

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333333',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'column',
    },
    headerRight: {
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#111111',
    },
    subtitle: {
        fontSize: 10,
        color: '#666666',
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1,
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    infoBlock: {
        width: '45%',
    },
    infoLabel: {
        fontSize: 8,
        color: '#888888',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    infoText: {
        fontSize: 10,
        marginBottom: 2,
    },
    table: {
        flexDirection: 'column',
        marginTop: 10,
        marginBottom: 20,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        paddingVertical: 6,
        alignItems: 'center',
    },
    tableHeader: {
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    tableHeadCell: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#555555',
        textTransform: 'uppercase',
    },
    tableCell: {
        fontSize: 9,
    },
    colDesc: { width: '50%', paddingLeft: 4 },
    colQty: { width: '15%', textAlign: 'right' },
    colPrice: { width: '15%', textAlign: 'right' },
    colTotal: { width: '20%', textAlign: 'right', paddingRight: 4 },
    footer: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    totalsContainer: {
        width: '40%',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    totalLabel: {
        fontSize: 9,
        color: '#666666',
    },
    totalValue: {
        fontSize: 9,
        fontWeight: 'normal',
        textAlign: 'right',
    },
    grandTotal: {
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        marginTop: 4,
        paddingTop: 4,
    },
    grandTotalText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    statusBadge: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 4,
        paddingVertical: 2,
        paddingHorizontal: 6,
        fontSize: 8,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    paymentStatusPaid: {
        backgroundColor: '#DCFCE7',
        color: '#166534',
        borderColor: '#DCFCE7',
    },
    paymentStatusPending: {
        backgroundColor: '#FEE2E2',
        color: '#991B1B',
        borderColor: '#FEE2E2',
    },
    paymentStatusPartial: {
        backgroundColor: '#FEF9C3',
        color: '#854D0E',
        borderColor: '#FEF9C3',
    }
});

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
    }).format(amount);
};

export const OrderPdf = ({ order }: OrderPdfProps) => {
    const subtotal = order.items.reduce((sum: number, item: any) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
    const tax = subtotal * 0.16;
    const total = Number(order.totalAmount);
    const totalPaid = order.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const pendingBalance = total - totalPaid;

    const isPaid = order.paymentStatus === 'PAID';
    const isPartial = order.paymentStatus === 'PARTIAL';

    const paymentBadgeStyle = isPaid ? styles.paymentStatusPaid : (isPartial ? styles.paymentStatusPartial : styles.paymentStatusPending);
    const paymentText = isPaid ? 'PAGADO' : (isPartial ? 'PARCIALMENTE PAGADO' : 'PENDIENTE DE PAGO');

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.title}>ORDEN DE VENTA</Text>
                        <Text style={styles.subtitle}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                        <View style={[styles.statusBadge, paymentBadgeStyle]}>
                            <Text>{paymentText}</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.infoText}>{format(new Date(order.createdAt), "PPP", { locale: es })}</Text>
                    </View>
                </View>

                <View style={styles.infoContainer}>
                    <View style={styles.infoBlock}>
                        <Text style={styles.infoLabel}>CLIENTE</Text>
                        <Text style={[styles.infoText, { fontWeight: 'bold' }]}>{order.entity.commercialName}</Text>
                        {order.entity.legalName && <Text style={styles.infoText}>{order.entity.legalName}</Text>}
                        {order.entity.taxId && <Text style={styles.infoText}>RFC: {order.entity.taxId}</Text>}
                    </View>
                    <View style={styles.infoBlock}>
                        <Text style={styles.infoLabel}>EMISOR</Text>
                        <Text style={styles.infoText}>Axioma ERP</Text>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableHeadCell, styles.colDesc]}>DESCRIPCIÓN</Text>
                        <Text style={[styles.tableHeadCell, styles.colQty]}>CANT.</Text>
                        <Text style={[styles.tableHeadCell, styles.colPrice]}>P. UNIT.</Text>
                        <Text style={[styles.tableHeadCell, styles.colTotal]}>IMPORTE</Text>
                    </View>

                    {order.items.map((item: any) => (
                        <View key={item.id} style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.colDesc]}>{item.product.name}</Text>
                            <Text style={[styles.tableCell, styles.colQty]}>{Number(item.quantity)}</Text>
                            <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(Number(item.unitPrice))}</Text>
                            <Text style={[styles.tableCell, styles.colTotal]}>
                                {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={styles.footer}>
                    <View style={styles.totalsContainer}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>SUBTOTAL:</Text>
                            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>IVA (16%):</Text>
                            <Text style={styles.totalValue}>{formatCurrency(tax)}</Text>
                        </View>
                        <View style={[styles.totalRow, styles.grandTotal]}>
                            <Text style={[styles.totalLabel, styles.grandTotalText]}>TOTAL:</Text>
                            <Text style={[styles.totalValue, styles.grandTotalText]}>{formatCurrency(total)}</Text>
                        </View>

                        {/* Separator line for payments */}
                        <View style={{ marginTop: 4, marginBottom: 4, height: 1, backgroundColor: '#EEEEEE' }} />

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>PAGADO:</Text>
                            <Text style={styles.totalValue}>{formatCurrency(totalPaid)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={[styles.totalLabel, { color: pendingBalance > 0.01 ? '#991B1B' : '#166534' }]}>
                                SALDO PENDIENTE:
                            </Text>
                            <Text style={[styles.totalValue, { fontWeight: 'bold', color: pendingBalance > 0.01 ? '#991B1B' : '#166534' }]}>
                                {formatCurrency(pendingBalance)}
                            </Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
