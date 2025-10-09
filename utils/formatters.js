export const formatPrice = (price) => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export const formatDate = (date) => {
  return new Intl.DateFormat('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};