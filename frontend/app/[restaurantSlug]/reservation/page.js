'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export default function Reservation() {
   const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedTable, setSelectedTable] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [reservationData, setReservationData] = useState({
    date: '',
    time: '',
    persons: '2',
    specialRequests: ''
  });
  const [paymentAmount, setPaymentAmount] = useState(500); // Initial payment 500
  const [paymentMethod, setPaymentMethod] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmationId, setConfirmationId] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Payment methods with account details
  const paymentMethods = {
    'EasyPaisa': {
      name: 'EasyPaisa',
      icon: '📱',
      accountNumber: '03001234567',
      accountName: 'Restaurant Management',
      instructions: 'Send payment to the above number and share screenshot'
    },
    'JazzCash': {
      name: 'JazzCash',
      icon: '💳',
      accountNumber: '03009876543',
      accountName: 'Restaurant Management',
      instructions: 'Transfer amount to the above account and confirm'
    },
    'UBL Bank': {
      name: 'UBL Bank Account',
      icon: '🏦',
      accountNumber: '1234567890123456',
      accountName: 'Restaurant Management Pvt Ltd',
      instructions: 'Bank transfer or online payment to the above account'
    }
  };

  // Fetch restaurant data on mount
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        if (!params?.restaurantSlug) return;

        const response = await fetch(`/api/restaurants/slug/${params.restaurantSlug}`);
        if (!response.ok) throw new Error("Failed to fetch restaurant");

        const data = await response.json();
        if (!data?._id) throw new Error("Invalid restaurant data");

        setRestaurant(data);
      } catch (err) {
        console.error("Restaurant fetch error:", err);
        setError(err.message);
        toast.error("Failed to load restaurant data");
      }
    };

    fetchRestaurant();
  }, [params?.restaurantSlug]);

  // Fetch available tables when criteria changes
  useEffect(() => {
    const fetchAvailableTables = async () => {
      if (!restaurant?._id || !reservationData.date || !reservationData.time || !reservationData.persons) {
        return;
      }

      setIsCheckingAvailability(true);
      setError(null);

      try {
        const [day, month, year] = reservationData.date.split('-');
        const apiDate = `${year}-${month}-${day}`;
        const partySize = parseInt(reservationData.persons);

        const response = await fetch(
          `/api/tables/availability?restaurantId=${restaurant._id}&date=${apiDate}&time=${reservationData.time}&partySize=${partySize}`
        );

        if (!response.ok) {
          throw new Error('Failed to check table availability');
        }

        const data = await response.json();

        if (data.available) {
          setAvailableTables([{
            id: data.tableId,
            number: data.tableNumber,
            capacity: data.tableSize
          }]);
        } else {
          setAvailableTables([]);
          setError('No tables available for the selected time. Please try a different time.');
        }
      } catch (err) {
        console.error('Table availability check failed:', err);
        setError(err.message || 'Failed to check table availability');
        setAvailableTables([]);
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    const timer = setTimeout(() => {
      fetchAvailableTables();
    }, 500);

    return () => clearTimeout(timer);
  }, [reservationData, restaurant]);

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setStep(2);
    toast.success('Table selected! ✨');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReservationData(prev => ({ ...prev, [name]: value }));

    if (name === 'persons') {
      setPaymentAmount(500); // Fixed initial payment amount
    }
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setError(null);
  };

  function validateReservationInputs(date, time, partySize) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return { valid: false, message: "Invalid date format. Please use YYYY-MM-DD" };
    }

    const timeRegex = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(time)) {
      return { valid: false, message: "Invalid time format. Please use HH:MM (e.g., 19:30)" };
    }

    const hours = parseInt(time.split(':')[0]);
    if (hours < 11 || hours > 22) {
      return { valid: false, message: "Restaurant is only open from 11:00 to 22:00" };
    }

    const size = parseInt(partySize);
    if (isNaN(size) || size < 1 || size > 12) {
      return { valid: false, message: "Party size must be between 1 and 12" };
    }

    return { valid: true };
  }

  const validatePaymentData = () => {
    if (!paymentMethod) {
      setError("Please select a payment method");
      return false;
    }
    if (!transactionId.trim()) {
      setError("Please enter the transaction ID");
      return false;
    }
    if (transactionId.trim().length < 6) {
      setError("Transaction ID must be at least 6 characters long");
      return false;
    }
    return true;
  };

  const handleReserve = async () => {
    if (!selectedTable || !restaurant) {
      setError("Please select a table first");
      return;
    }
    if (!user) {
      toast.error('Please log in to make a reservation');
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [day, month, year] = reservationData.date.split('-');
      const apiDate = `${year}-${month}-${day}`;
      const partySize = parseInt(reservationData.persons);

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant._id,
          restaurantSlug: restaurant.slug,
          date: apiDate,
          time: reservationData.time,
          customerEmail: user.email, 
          partySize,
          tableId: selectedTable.id,
          specialRequests: reservationData.specialRequests
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create reservation');
      }

      setConfirmationId(data._id);
      setStep(3);
      toast.success('Reservation confirmed! 🎉');
    } catch (err) {
      console.error('Reservation Error:', err);
      setError(err.message || 'Failed to complete reservation');
      toast.error(err.message || 'Failed to complete reservation');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!validatePaymentData()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: confirmationId,
          amount: paymentAmount,
          method: paymentMethod,
          transactionId: transactionId.trim() // Add this line
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      setStep(4);
      toast.success('Payment completed successfully! 💰');
    } catch (err) {
      console.error('Payment Error:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedTable(null);
    setReservationData({ date: '', time: '', persons: '2', specialRequests: '' });
    setPaymentAmount(500);
    setPaymentMethod('');
    setTransactionId('');
    setConfirmationId(null);
    setError(null);
    setAvailableTables([]);
  };

  const renderProgress = () => (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {['Select Table', 'Details', 'Payment', 'Confirmation'].map((label, index) => (
          <div key={index} className="flex flex-col items-center relative z-10">
            <motion.div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${index + 1 === step ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg scale-110' :
                  index + 1 < step ? 'bg-teal-500 border-teal-500 text-white' :
                    'bg-white border-gray-300 text-gray-400'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {index + 1 < step ? '✓' : index + 1}
            </motion.div>
            <span className={`text-xs mt-2 font-medium transition-colors duration-300 ${index + 1 === step ? 'text-emerald-600' :
                index + 1 < step ? 'text-teal-600' :
                  'text-gray-400'
              }`}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="relative flex-grow mt-4">
        <div className="absolute top-0 left-5 right-5 h-2 bg-gray-200 rounded-full"></div>
        <motion.div
          className="absolute top-0 left-5 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, (step - 1) * 33.33)}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        ></motion.div>
      </div>
    </div>
  );

  const renderTableAvailability = () => {
    if (isCheckingAvailability) {
      return (
        <div className="flex justify-center py-8">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-500"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-400 opacity-20 animate-pulse"></div>
          </div>
        </div>
      );
    }

    if (!reservationData.date || !reservationData.time) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8 text-gray-500 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100"
        >
          <div className="text-4xl mb-2">🍽️</div>
          <p>Please select date and time to see available tables</p>
        </motion.div>
      );
    }

    if (availableTables.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8 bg-red-50 rounded-xl border border-red-200"
        >
          <div className="text-4xl mb-2">😔</div>
          <p className="text-red-600 font-medium">{error || 'No tables available for the selected time'}</p>
        </motion.div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 mb-6">
        {availableTables.map((table, index) => (
          <motion.div
            key={table.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleTableSelect(table)}
            className={`relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${selectedTable?.id === table.id ?
                'bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-emerald-400 shadow-lg' :
                'bg-white border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-md'
              }`}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-400 to-teal-400 opacity-10 rounded-full -mr-10 -mt-10"></div>
            <div className="flex justify-between items-center relative z-10">
              <div>
                <h3 className="font-bold text-emerald-800 text-lg">Table #{table.number || table.id.slice(-4)}</h3>
                <p className="text-teal-600 font-medium">Capacity: {table.capacity} persons</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-xs bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full font-medium mb-2">
                  Available ✓
                </div>
                <div className="text-2xl">🪑</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
        Select Date & Time ⏰
      </h2>
      <div className="space-y-6 mb-6">
        <motion.div whileHover={{ scale: 1.02 }} className="relative">
          <label className="block text-sm font-semibold text-emerald-700 mb-2">📅 Date</label>
          <input
            type="date"
            name="date"
            min={today}
            value={reservationData.date}
            onChange={handleInputChange}
            className="w-full p-4 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-300 bg-gradient-to-r from-white to-emerald-50"
            required
          />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="relative">
          <label className="block text-sm font-semibold text-emerald-700 mb-2">⏰ Time</label>
          <input
            type="time"
            name="time"
            value={reservationData.time}
            onChange={handleInputChange}
            min="11:00"
            max="22:00"
            className="w-full p-4 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-300 bg-gradient-to-r from-white to-emerald-50"
            required
          />
          <p className="text-xs text-teal-600 mt-2 font-medium">🕐 Restaurant hours: 11:00 AM - 10:00 PM</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="relative">
          <label className="block text-sm font-semibold text-emerald-700 mb-2">👥 Number of Guests</label>
          <input
            type="number"
            name="persons"
            value={reservationData.persons}
            onChange={handleInputChange}
            min="1"
            max="12"
            className="w-full p-4 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-300 bg-gradient-to-r from-white to-emerald-50"
            required
          />
        </motion.div>
      </div>
      <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
        Available Tables 🍽️
      </h3>
      {renderTableAvailability()}
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
        Reservation Details 📝
      </h2>
      <div className="space-y-6 mb-8">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border-2 border-emerald-200 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-300 to-teal-300 opacity-20 rounded-full -mr-12 -mt-12"></div>
          <h3 className="font-bold text-emerald-800 mb-4 text-lg flex items-center">
            <span className="mr-2">🪑</span> Your Selected Table
          </h3>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div>
              <p className="font-semibold text-emerald-700">Table #{selectedTable?.number || selectedTable?.id?.slice(-4)}</p>
              <p className="text-teal-600">Capacity: {selectedTable?.capacity} persons</p>
            </div>
            <div className="text-right">
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {selectedTable?.size || 'Premium'}
              </span>
            </div>
          </div>
        </motion.div>

        {[
          { label: '📅 Date', value: reservationData.date, icon: '📅' },
          { label: '⏰ Time', value: reservationData.time, icon: '⏰' },
          { label: '👥 Guests', value: reservationData.persons, icon: '👥' }
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className="bg-gradient-to-r from-white to-emerald-50 p-4 rounded-xl border border-emerald-200"
          >
            <label className="block text-sm font-semibold text-emerald-700 mb-2">{item.label}</label>
            <p className="text-lg font-medium text-gray-800">{item.value}</p>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-semibold text-emerald-700 mb-2">
            💬 Special Requests (Optional)
          </label>
          <textarea
            name="specialRequests"
            value={reservationData.specialRequests}
            onChange={handleInputChange}
            className="w-full p-4 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-300 bg-gradient-to-br from-white to-emerald-50"
            rows={4}
            placeholder="Any dietary restrictions, celebrations, or special arrangements..."
          />
        </motion.div>
      </div>

      <div className="flex justify-between gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setStep(1)}
          className="px-6 py-3 text-emerald-600 border-2 border-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-300 font-semibold"
        >
          ← Back
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReserve}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold shadow-lg transition-all duration-300"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Processing...
            </>
          ) : 'Confirm Reservation ✓'}
        </motion.button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
        Payment Details 💳
      </h2>
      <div className="space-y-6 mb-8">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border-2 border-emerald-200 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-300 to-teal-300 opacity-20 rounded-full -mr-12 -mt-12"></div>
          <h3 className="font-bold text-emerald-800 mb-4 text-lg flex items-center">
            <span className="mr-2">📋</span> Reservation Summary
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm relative z-10">
            <p className="text-teal-600 font-medium">📅 Date:</p>
            <p className="font-semibold">{reservationData.date}</p>
            <p className="text-teal-600 font-medium">⏰ Time:</p>
            <p className="font-semibold">{reservationData.time}</p>
            <p className="text-teal-600 font-medium">👥 Guests:</p>
            <p className="font-semibold">{reservationData.persons}</p>
            <p className="text-teal-600 font-medium">🪑 Table:</p>
            <p className="font-semibold">Table #{selectedTable?.number || selectedTable?.id?.slice(-4)}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border-2 border-yellow-200"
        >
          <label className="block text-sm font-semibold text-amber-700 mb-2">💰 Initial Payment Amount</label>
          <p className="text-3xl font-bold text-amber-800">PKR {paymentAmount}</p>
          <p className="text-sm text-amber-600 mt-1">Booking confirmation fee</p>
        </motion.div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-emerald-700 mb-4">💳 Select Payment Method</label>
          {Object.entries(paymentMethods).map(([key, method], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <div className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 ${paymentMethod === key ?
                  'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg' :
                  'border-emerald-200 hover:border-emerald-300 hover:shadow-md'
                }`}
                onClick={() => handlePaymentMethodChange(key)}>
                <div className="flex items-center mb-3">
                  <input
                    type="radio"
                    id={key}
                    name="payment"
                    checked={paymentMethod === key}
                    onChange={() => handlePaymentMethodChange(key)}
                    className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 mr-3"
                  />
                  <label htmlFor={key} className="flex items-center cursor-pointer">
                    <span className="text-2xl mr-3">{method.icon}</span>
                    <span className="text-lg font-semibold text-emerald-800">{method.name}</span>
                  </label>
                </div>

                {paymentMethod === key && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 bg-white rounded-lg border border-emerald-200"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-emerald-700">Account Number:</span>
                        <span className="font-mono font-bold text-gray-800">{method.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-emerald-700">Account Name:</span>
                        <span className="font-semibold text-gray-800">{method.accountName}</span>
                      </div>
                      <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium">📝 Instructions:</p>
                        <p className="text-sm text-blue-700 mt-1">{method.instructions}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

          ))}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <label className="block text-sm font-semibold text-emerald-700 mb-3">
              🔢 Transaction ID / Reference Number
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => {
                setTransactionId(e.target.value);
                setError(null); // Clear error when user starts typing
              }}
              placeholder="Enter your transaction ID or reference number"
              className="w-full p-4 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-300 bg-gradient-to-r from-white to-emerald-50 font-mono"
              required
            />
            <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800 font-medium flex items-center">
                <span className="mr-2">💡</span>
                Important Instructions:
              </p>
              <ul className="text-sm text-amber-700 mt-2 space-y-1 ml-6">
                <li>• Complete the payment using selected method above</li>
                <li>• Copy the transaction ID from your payment receipt</li>
                <li>• Enter the exact transaction ID in the field above</li>
                <li>• This helps our staff verify your payment quickly</li>
              </ul>
            </div>
          </motion.div>
          {error && !paymentMethod && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm mt-2 p-3 bg-red-50 rounded-lg border border-red-200"
            >
              {error}
            </motion.p>
          )}
        </div>
      </div>

      <div className="flex justify-between gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setStep(2)}
          className="px-6 py-3 text-emerald-600 border-2 border-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-300 font-semibold"
        >
          ← Back
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePayment}
          disabled={loading || !paymentMethod}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold shadow-lg transition-all duration-300"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Processing Payment...
            </>
          ) : 'Complete Payment 💳'}
        </motion.button>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
      >
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-3xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
          🎉 Reservation Confirmed!
        </h2>
        <p className="text-gray-600 mb-8 text-lg">Your table has been successfully booked</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl mb-8 text-left border-2 border-emerald-200 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-300 to-teal-300 opacity-10 rounded-full -mr-16 -mt-16"></div>
        <h3 className="font-bold text-emerald-800 mb-4 text-lg flex items-center">
          <span className="mr-2">🎫</span> Booking Confirmation
        </h3>
        <div className="space-y-3 relative z-10">
          {[
            { label: '🆔 Confirmation ID', value: confirmationId },
            { label: '🔢 Transaction ID', value: transactionId },
            { label: '📅 Date', value: reservationData.date },
            { label: '⏰ Time', value: reservationData.time },
            { label: '🪑 Table', value: `#${selectedTable?.number || selectedTable?.id?.slice(-4)}` },
            { label: '💳 Payment Method', value: paymentMethods[paymentMethod]?.name || paymentMethod },
            { label: '💰 Amount Paid', value: `PKR ${paymentAmount}` }
            
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + (index * 0.1) }}
              className="flex justify-between items-center py-2 border-b border-emerald-100 last:border-b-0"
            >
              <span className="font-semibold text-emerald-700">{item.label}:</span>
              <span className="font-medium text-gray-800">{item.value}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl mb-8 border border-blue-200"
      >
        <p className="text-blue-800 font-medium text-sm">
          📱 You will receive SMS confirmation shortly with all booking details!
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="flex flex-col sm:flex-row justify-center gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetForm}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 font-semibold shadow-lg transition-all duration-300"
        >
          🔄 Make Another Reservation
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/')}
          className="px-6 py-3 text-emerald-600 border-2 border-emerald-600 rounded-xl hover:bg-emerald-50 font-semibold transition-all duration-300"
        >
          🏠 Return Home
        </motion.button>
      </motion.div>
    </motion.div>
  );

  // Show loading or error state if restaurant data isn't loaded
  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        {error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border-2 border-red-200"
          >
            <div className="text-6xl mb-4">😞</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 font-semibold shadow-lg transition-all duration-300"
            >
              🔄 Try Again
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-500"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-400 opacity-20 animate-pulse"></div>
            </div>
            <p className="text-emerald-700 font-medium text-lg">Loading restaurant details...</p>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-emerald-300 to-teal-300 opacity-10 rounded-full"></div>
        <div className="absolute top-1/3 right-10 w-24 h-24 bg-gradient-to-br from-teal-300 to-cyan-300 opacity-10 rounded-full"></div>
        <div className="absolute bottom-10 left-1/4 w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-400 opacity-10 rounded-full"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-emerald-100 relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-2">
            🍽️ {restaurant.name}
          </h1>
          <p className="text-gray-600 font-medium">Reserve your perfect dining experience</p>
        </motion.div>

        {renderProgress()}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        {error && step !== 4 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl"
          >
            <p className="text-red-600 text-center text-sm font-medium flex items-center justify-center">
              <span className="mr-2">⚠️</span>
              {error}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}