const express = require('express');
const app = express();
app.use(express.json());

// Simulation de la base de données en mémoire pour vos livreurs à Gagnoa
let drivers = [
  { id: "MOTO_01", name: "Kouadio", status: "AVAILABLE", phone: "+2250700000001" },
  { id: "MOTO_02", name: "Traoré", status: "AVAILABLE", phone: "+2250700000002" }
];

let orders = [];

// Formule de tarif Gozo : 500 FCFA de base + 200 FCFA / km
function calculatePrice(distanceKm) {
  const basePrice = 500;
  const pricePerKm = 200;
  return basePrice + (distanceKm * pricePerKm);
}

// 1. Créer une nouvelle commande client
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
    paymentMethod, // 'Wave', 'Orange Money', 'MTN Money', 'Moov Money', 'Espèces'
    paymentTiming, // 'BEFORE', 'DURING', 'ON_DELIVERY'
    paymentStatus: 'PENDING',
    status: 'CREATED',
    assignedDriverId: null,
    createdAt: new Date()
  };

  // Attribution automatique au premier livreur disponible
  const availableDriver = drivers.find(d => d.status === "AVAILABLE");
  if (availableDriver) {
    newOrder.assignedDriverId = availableDriver.id;
    newOrder.status = "ASSIGNED";
    availableDriver.status = "BUSY";
  }

  orders.push(newOrder);

  res.status(201).json({
    message: "Commande Gozo enregistrée avec succès",
    order: newOrder
  });
});

// 2. Panneau Admin : Attribution ou réattribution manuelle d'un livreur
app.post('/api/admin/reassign', (req, res) => {
  const { orderId, driverId } = req.body;

  const order = orders.find(o => o.id === orderId);
  const driver = drivers.find(d => d.id === driverId);

  if (!order || !driver) {
    return res.status(404).json({ message: "Commande ou Livreur non trouvé" });
  }

  if (order.assignedDriverId) {
    const previousDriver = drivers.find(d => d.id === order.assignedDriverId);
    if (previousDriver) previousDriver.status = "AVAILABLE";
  }

  order.assignedDriverId = driver.id;
  order.status = "ASSIGNED";
  driver.status = "BUSY";

  res.json({ message: `Course réattribuée à ${driver.name}`, order });
});

// 3. Mise à jour du statut de la livraison
app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, paymentStatus } = req.body;

  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ message: "Commande introuvable" });

  if (status) order.status = status;
  if (paymentStatus) order.paymentStatus = paymentStatus;

  if (status === 'DELIVERED' || status === 'CANCELLED') {
    const driver = drivers.find(d => d.id === order.assignedDriverId);
    if (driver) driver.status = "AVAILABLE";
  }

  res.json({ message: "Statut mis à jour", order });
});

// 4. Consulter une commande
app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ message: "Commande introuvable" });
  res.json(order);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur Gozo Livraison en écoute sur le port ${PORT}`));
