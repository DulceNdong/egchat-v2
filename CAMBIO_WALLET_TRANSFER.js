// REEMPLAZO COMPLETO PARA: app.post('/api/wallet/transfer', ...)
// Ubicación: server/index.js línea ~2445
// Busca la función que empieza con: app.post('/api/wallet/transfer', auth, async (req, res) => {
// Y reemplázala COMPLETA por este código:

app.post('/api/wallet/transfer', auth, async (req, res) => {
  try {
    const { to, amount, concept } = req.body;
    
    // Validación básica
    if (!to || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Destinatario y monto requeridos' });
    }
    if (amount > 10000000) {
      return res.status(400).json({ message: 'Monto máximo: 10,000,000 XAF' });
    }

    // Obtener wallet del remitente
    const { data: senderWallet, error: senderError } = await supabase
      .from('wallets').select('balance').eq('user_id', req.user.id).single();

    if (senderError || !senderWallet) {
      return res.status(404).json({ message: 'Wallet no encontrado' });
    }

    if (amount > senderWallet.balance) {
      return res.status(400).json({ message: 'Saldo insuficiente' });
    }

    // Buscar destinatario por teléfono, ID o nombre de usuario
    let recipientId = null;
    let recipientName = to;

    // Intentar buscar por ID primero
    if (to.match(/^[0-9a-f-]{36}$/i)) {
      const { data: userById } = await supabase
        .from('users').select('id, full_name').eq('id', to).single();
      if (userById) {
        recipientId = userById.id;
        recipientName = userById.full_name;
      }
    }

    // Si no se encontró, buscar por teléfono
    if (!recipientId && to.match(/^\+?[0-9\s()-]+$/)) {
      const cleanPhone = to.replace(/[^0-9+]/g, '');
      const { data: userByPhone } = await supabase
        .from('users').select('id, full_name').eq('phone', cleanPhone).single();
      if (userByPhone) {
        recipientId = userByPhone.id;
        recipientName = userByPhone.full_name;
      }
    }

    // Verificar que no sea auto-transferencia
    if (recipientId && recipientId === req.user.id) {
      return res.status(400).json({ message: 'No puedes transferir dinero a ti mismo' });
    }

    // Actualizar balance del remitente
    const newBalance = senderWallet.balance - amount;
    const { error: updateError } = await supabase
      .from('wallets').update({ balance: newBalance }).eq('user_id', req.user.id);

    if (updateError) {
      console.error('Error updating sender wallet:', updateError);
      return res.status(500).json({ message: 'Error al procesar la transferencia' });
    }

    // Si se encontró destinatario, actualizar su wallet
    if (recipientId) {
      const { data: recipientWallet } = await supabase
        .from('wallets').select('balance').eq('user_id', recipientId).single();
      
      if (recipientWallet) {
        await supabase.from('wallets')
          .update({ balance: recipientWallet.balance + amount })
          .eq('user_id', recipientId);
      }
    }

    // Registrar transacción del remitente
    const { data: tx } = await supabase.from('transactions').insert({
      user_id: req.user.id,
      type: 'transfer_sent',
      amount: -amount,
      method: 'EGCHAT',
      reference: `Transferencia a: ${recipientName}${concept ? ' · ' + concept : ''}`,
      status: 'completed',
      created_at: new Date().toISOString()
    }).select().single();

    // Si hay destinatario registrado, crear su transacción de ingreso
    if (recipientId) {
      await supabase.from('transactions').insert({
        user_id: recipientId,
        type: 'transfer_received',
        amount: amount,
        method: 'EGCHAT',
        reference: `Transferencia de usuario${concept ? ' · ' + concept : ''}`,
        status: 'completed',
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      balance: newBalance,
      transaction: tx,
      recipient: recipientName,
      message: 'Transferencia completada exitosamente'
    });
  } catch (e) {
    console.error('POST /api/wallet/transfer error:', e);
    res.status(500).json({ message: e.message || 'Error al procesar la transferencia' });
  }
});
