'use client';

import { motion } from 'framer-motion';
import StockCard from './StockCard';
import type { StockWithoutDeleted } from '@/lib/stock-db';

interface StockGridProps {
  stocks: StockWithoutDeleted[];
  onEdit: (stock: StockWithoutDeleted) => void;
  onDelete: (id: string) => void;
}

export default function StockGrid({ stocks, onEdit, onDelete }: StockGridProps) {
  return (
    <motion.div 
      layout
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 w-full max-w-full"
    >
      {stocks.map((stock, index) => (
        <motion.div
          key={stock.id}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <StockCard
            stock={stock}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
