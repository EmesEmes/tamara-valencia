import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { amount, items } = await request.json();

    console.log('=== PAYPHONE CREATE ===');
    console.log('Amount:', amount);

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Monto inválido' },
        { status: 400 }
      );
    }

    // Verificar credenciales
    const token = process.env.NEXT_PUBLIC_PAYPHONE_TOKEN;
    const storeId = process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID;

    if (!token || !storeId) {
      return NextResponse.json(
        { error: 'Credenciales de PayPhone no configuradas' },
        { status: 500 }
      );
    }

    // Calcular correctamente según PayPhone
    // Total = subtotal + IVA
    // Si total = 20, y IVA = 15%
    // Entonces: subtotal = total / 1.15
    // IVA = total - subtotal
    
    const totalAmount = parseFloat(amount.toFixed(2));
    const amountWithTax = parseFloat((totalAmount / 1.15).toFixed(2));
    const tax = parseFloat((totalAmount - amountWithTax).toFixed(2));

    // Generar ID único de transacción
    const clientTransactionId = `ORDER-${Date.now()}`;

    // Preparar datos para PayPhone
    const paymentData = {
      amount: totalAmount,
      amountWithoutTax: 0,
      amountWithTax: amountWithTax,
      tax: tax,
      service: 0,
      tip: 0,
      currency: 'USD',
      reference: 'Tamara Valencia Joyas',
      clientTransactionId: clientTransactionId,
      storeId: storeId
    };

    console.log('Payment Data:', JSON.stringify(paymentData, null, 2));
    console.log('Verificación:', amountWithTax + tax, '=', totalAmount);

    // Llamar a la API de PayPhone
    const response = await fetch(
      'https://pay.payphonetodoesposible.com/api/button/Prepare',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      }
    );

    const responseText = await response.text();
    console.log('PayPhone Response Status:', response.status);
    console.log('PayPhone Response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing PayPhone response:', e);
      return NextResponse.json(
        { error: 'Respuesta inválida de PayPhone' },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('Error de PayPhone:', data);
      return NextResponse.json(
        { error: data.message || 'Error al preparar el pago con PayPhone' },
        { status: response.status }
      );
    }

    console.log('PayPhone Success:', data);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error creando pago:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear el pago' },
      { status: 500 }
    );
  }
}