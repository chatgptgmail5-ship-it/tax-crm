onClick={() => {
  const msg = whatsappMessage.trim();
  if (!msg) {
  alert("נא להזין הודעה");
  return;
  }
  
  const recipientIds = [
  ...(waBulkRecipientIdsRef.current ?? [])
  ];
  
  if (recipientIds.length === 0) {
  alert("לא נבחרו לקוחות לשליחה");
  return;
  }
  
  for (const id of recipientIds) {
  const h = allHouseholds.find(x => x.id === id);
  if (!h) continue;
  
  const phone = getWaNumberForHousehold(h);
  if (!phone) continue;
  
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  
  window.open(url, "_blank", "noopener,noreferrer");
  }
  
  // ניקוי
  waBulkRecipientIdsRef.current = null;
  setWhatsappModalOpen(false);
  setWhatsappMessage("");
  setWhatsappRecipientsSnapshot(null);
  }}