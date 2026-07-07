export const formatDate = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const getExpirationStatus = (dateString) => {
  if (!dateString) return { label: 'No Date', className: 'bg-gray-100 text-gray-500 border-transparent', isExpiring: false };
  
  const target = new Date(dateString);
  const now = new Date();
  target.setHours(0,0,0,0);
  now.setHours(0,0,0,0);
  
  const diffTime = target - now;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, className: 'bg-red-50 text-red-600 border-red-100', isExpired: true, isExpiring: false };
  if (days === 0) return { label: 'Expires Today', className: 'bg-red-50 text-red-600 border-red-100 font-bold', isExpired: false, isExpiring: true };
  if (days <= 7) return { label: `Exp in ${days} days`, className: 'bg-orange-50 text-orange-600 border-orange-100', isExpired: false, isExpiring: true };
  if (days <= 30) return { label: `Exp in ${days} days`, className: 'bg-yellow-50 text-yellow-700 border-yellow-100', isExpired: false, isExpiring: false };
  return { label: 'Good', className: 'bg-emerald-50 text-emerald-600 border-emerald-100', isExpired: false, isExpiring: false };
};
