export const answeredCall = {
  id: "call_001",
  businessId: "biz_active_001",
  status: "completed",
  direction: "inbound",
  duration: 180,
  callerPhone: "+15125552222",
  sentiment: "positive",
  summary: "Customer called to schedule a pipe repair. Appointment booked for Friday 2 PM.",
  createdAt: new Date().toISOString(),
};

export const missedCall = {
  id: "call_002",
  businessId: "biz_active_001",
  status: "missed",
  direction: "inbound",
  duration: 0,
  callerPhone: "+15125553333",
  sentiment: null,
  summary: null,
  createdAt: new Date().toISOString(),
};

export const transferredCall = {
  id: "call_003",
  businessId: "biz_active_001",
  status: "transferred",
  direction: "inbound",
  duration: 45,
  callerPhone: "+15125554444",
  sentiment: "neutral",
  summary: "Customer requested to speak with owner about an estimate. Transferred to owner phone.",
  createdAt: new Date().toISOString(),
};
