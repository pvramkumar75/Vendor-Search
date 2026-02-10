import React from 'react';
import { motion } from 'framer-motion';
import { Download, MapPin, Phone, Star, Building2, ExternalLink } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Vendor } from '../types';

interface VendorTableProps {
    vendors: Vendor[];
    onLoadMore?: () => void;
    isLoadingMore?: boolean;
}

export const VendorTable: React.FC<VendorTableProps> = ({ vendors, onLoadMore, isLoadingMore }) => {
    if (vendors.length === 0) return null;

    const exportPDF = () => {
        const doc = new jsPDF();

        // Add Header
        doc.setFontSize(20);
        doc.setTextColor(41, 128, 185);
        doc.text("Vendor Sourcing Report", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

        const tableData = vendors.map(v => [
            v.name,
            v.contact || 'N/A',
            v.address || 'N/A',
            v.city || 'N/A',
            v.website || 'N/A',
            v.rating ? `${v.rating}/5` : '-'
        ]);

        autoTable(doc, {
            head: [['Vendor Name', 'Contact', 'Address', 'City', 'Website', 'Rating']],
            body: tableData,
            startY: 40,
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            alternateRowStyles: { fillColor: [240, 248, 255] },
        });

        doc.save('vendor_sourcing_report.pdf');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mt-8"
        >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        Identified Suppliers
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Found {vendors.length} potential partners</p>
                </div>
                <button
                    onClick={exportPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm font-medium text-sm"
                >
                    <Download className="w-4 h-4" />
                    Export PDF
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                            <th className="px-6 py-4">Company</th>
                            <th className="px-6 py-4">Location</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Website</th>
                            <th className="px-6 py-4 text-center">Trust Rating</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {vendors.map((vendor, index) => (
                            <motion.tr
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                key={index}
                                className="hover:bg-blue-50/30 transition-colors group"
                            >
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-slate-900">{vendor.name}</div>
                                    <div className="text-xs text-slate-400 mt-0.5 max-w-[200px] truncate">{vendor.category}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{vendor.city || vendor.address?.split(',')[0]}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-slate-600 text-sm max-w-[180px]">
                                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                        <span className="truncate" title={vendor.contact || vendor.address}>{vendor.contact || 'Available on Platform'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {vendor.website && vendor.website !== 'N/A' ? (
                                        <a
                                            href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium"
                                        >
                                            Visit <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <span className="text-slate-400 text-sm italic">Not direct</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {vendor.rating ? (
                                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold border border-amber-100">
                                            <Star className="w-3 h-3 fill-current" />
                                            {vendor.rating}
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {onLoadMore && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-center">
                    <button
                        onClick={onLoadMore}
                        disabled={isLoadingMore}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {isLoadingMore ? 'Sourcing more suppliers...' : 'Load More Suppliers'}
                    </button>
                </div>
            )}
        </motion.div>
    );
};
