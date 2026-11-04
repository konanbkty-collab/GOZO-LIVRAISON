const express = require('express');
const app = express();

// --- AJOUTER CETTE LIGNE POUR AUTORISER LE TÉLÉPHONE (DARTPAD) ---
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
// -----------------------------------------------------------------

app.use(express.json());

let drivers = [
  { id: "MOTO_01", name: "Kouadio", status: "AVAILABLE", phone: "+2250700000001" },
  { id: "MOTO_02", name: "Traoré", status: "AVAILABLE", phone: "+2250700000002" }
];

let orders = [];

function calculatePrice(distanceKm) {
  const basePrice = 500;
  const pricePerKm = 200;
  return basePrice + (distanceKm * pricePerKm);
}

app.post('/api/orders', (req, res) => {
  const { clientPhone, recipientPhone, pickupLocation, dropoffLocation, distanceKm, paymentMethod, paymentTiming } = req.body;
  const totalPrice = calculatePrice(distanceKm);

  const newOrder = {
    id: "GOZO_" + Date.now(),
    clientPhone,
    recipientPhone,
    pickupLocation,
    dropoffLocation,
    distanceKm,
    totalPrice,
    paymentMethod,
    paymentTiming,
    paymentStatus: 'PENDING',
    status: 'CREATED',
    assignedDriverId: null,
    createdAt: new Date()
  };

  const availableDriver = drivers.find(d => d.status === "AVAILABLE");
  if (availableDriver) {
    newOrder.assignedDriverId = availableDriver.id;
    newOrder.status = "ASSIGNED";
    availableDriver.status = "BUSY";
  }

  orders.push(newOrder);
  res.status(201).json({ message: "Commande Gozo enregistrée avec succès", order: newOrder });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur Gozo Livraison en écoute sur le port ${PORT}`));
