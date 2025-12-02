export const SUBSCRIPTIONS = {
  free: {
    label: 'Free',
    price: '$0',
    allowedPillars: ['sleep', 'mental_health']
  },
  basic: {
    label: 'Basic',
    price: '$4.99/mo',
    allowedPillars: ['sleep', 'mental_health', 'exercise', 'diet']
  },
  premium: {
    label: 'Premium',
    price: '$9.99/mo',
    allowedPillars: ['sleep','mental_health','exercise','diet','physical_health','finances','social','spirituality']
  },
  nhs_referred: {
    label: 'NHS Referred',
    price: 'Special',
    allowedPillars: ['sleep','mental_health','exercise']
  }
};

export default SUBSCRIPTIONS;
