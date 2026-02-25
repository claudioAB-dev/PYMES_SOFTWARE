import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PayrollSlipPdfProps {
    payroll: any;
    organization: any;
}

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingBottom: 20,
        marginBottom: 20,
    },
    companyInfo: {
        flexDirection: 'column',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
    },
    slipInfo: {
        alignItems: 'flex-end',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
        backgroundColor: '#F9FAFB',
        padding: 5,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    col: {
        flexDirection: 'column',
        width: '48%',
    },
    label: {
        fontSize: 8,
        color: '#888',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    value: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    table: {
        marginTop: 10,
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#CCC',
        paddingBottom: 5,
        marginBottom: 5,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 4,
    },
    colItem: { width: '50%' },
    colAmount: { width: '25%', textAlign: 'right' },
    colHeader: { fontSize: 9, fontWeight: 'bold', color: '#555' },
    totals: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 10,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 4,
    },
    totalLabel: {
        fontSize: 10,
        color: '#555',
    },
    totalValue: {
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'right',
    },
    grandTotal: {
        marginTop: 5,
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 5,
    },
    grandTotalLabel: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    grandTotalValue: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
    },
    signatures: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 50,
    },
    signatureBox: {
        width: '40%',
        borderTopWidth: 1,
        borderTopColor: '#000',
        alignItems: 'center',
        paddingTop: 5,
    },
    signatureName: {
        fontSize: 9,
    },
    deductionText: {
        color: '#991B1B',
    }
});

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
};

export const PayrollSlipPdf = ({ payroll, organization }: PayrollSlipPdfProps) => {
    const { employee } = payroll;

    const formatDate = (date: Date) => format(new Date(date), "dd/MM/yyyy", { locale: es });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.companyInfo}>
                        <Text style={styles.title}>{organization.name}</Text>
                        {organization.taxId && <Text style={styles.subtitle}>RFC: {organization.taxId}</Text>}
                        <Text style={styles.subtitle}>Recibo de Nómina</Text>
                    </View>
                    <View style={styles.slipInfo}>
                        <Text style={styles.subtitle}>Folio: {payroll.id.slice(0, 8).toUpperCase()}</Text>
                        <Text style={styles.subtitle}>Periodo: {formatDate(payroll.periodStart)} al {formatDate(payroll.periodEnd)}</Text>
                        <Text style={styles.subtitle}>Fecha Pago: {payroll.paymentDate ? formatDate(payroll.paymentDate) : 'Pendiente'}</Text>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Empleado</Text>
                        <Text style={styles.value}>{employee.firstName} {employee.lastName}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>RFC / NSS</Text>
                        <Text style={styles.value}>{employee.taxId || 'N/A'} / {employee.socialSecurityNumber || 'N/A'}</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Desglose de Percepciones y Deducciones</Text>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.colItem, styles.colHeader]}>Concepto</Text>
                        <Text style={[styles.colAmount, styles.colHeader]}>Percepciones</Text>
                        <Text style={[styles.colAmount, styles.colHeader]}>Deducciones</Text>
                    </View>

                    <View style={styles.tableRow}>
                        <Text style={styles.colItem}>Sueldo Base</Text>
                        <Text style={styles.colAmount}>{formatCurrency(Number(payroll.grossAmount))}</Text>
                        <Text style={styles.colAmount}></Text>
                    </View>

                    {Number(payroll.deductions) > 0 && (
                        <View style={styles.tableRow}>
                            <Text style={styles.colItem}>Retenciones y Deducciones</Text>
                            <Text style={styles.colAmount}></Text>
                            <Text style={[styles.colAmount, styles.deductionText]}>{formatCurrency(Number(payroll.deductions))}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.totals}>
                    <View style={styles.col}>
                    </View>
                    <View style={styles.col}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Percepciones:</Text>
                            <Text style={styles.totalValue}>{formatCurrency(Number(payroll.grossAmount))}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Deducciones:</Text>
                            <Text style={[styles.totalValue, styles.deductionText]}>- {formatCurrency(Number(payroll.deductions))}</Text>
                        </View>
                        <View style={[styles.totalRow, styles.grandTotal]}>
                            <Text style={styles.grandTotalLabel}>NETO A PAGAR:</Text>
                            <Text style={styles.grandTotalValue}>{formatCurrency(Number(payroll.netAmount))}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <View style={styles.signatures}>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureName}>Firma de la Empresa</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureName}>Firma del Empleado ({employee.firstName} {employee.lastName})</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
