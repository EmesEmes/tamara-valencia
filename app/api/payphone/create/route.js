import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { amount, items } = await request.json();

    console.log('=== INICIO PAYPHONE CREATE ===');
    console.log('Amount recibido (dólares):', amount);

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Monto inválido' },
        { status: 400 }
      );
    }

    // Verificar credenciales
    const token = process.env.NEXT_PUBLIC_PAYPHONE_TOKEN;
    const storeId = process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    console.log('Token:', token ? `${token.substring(0, 20)}...` : 'NO DEFINIDO');
    console.log('StoreID:', storeId || 'NO DEFINIDO');
    console.log('Site URL:', siteUrl);

    if (!token || !storeId) {
      return NextResponse.json(
        { error: 'Credenciales de PayPhone no configuradas correctamente' },
        { status: 500 }
      );
    }

    // Generar ID único de transacción
    const clientTransactionId = `ORDER-${Date.now()}`;

    // Convertir a centavos (multiplicar por 100)
    const amountInCents = Math.round(amount * 100);

    console.log('Amount en centavos:', amountInCents);

    // Preparar datos EXACTAMENTE como en la documentación
    const paymentData = {
      amount: amountInCents,
      amountWithoutTax: amountInCents,
      amountWithTax: 0,
      tax: 0,
      reference: 'Tamara Valencia Joyas',
      currency: 'USD',
      clientTransactionId: clientTransactionId,
      storeId: storeId,
      ResponseUrl: `${siteUrl}/carrito/confirmacion` // R mayúscula
    };

    console.log('Datos a enviar a PayPhone:', JSON.stringify(paymentData, null, 2));

    // Llamar a la API de PayPhone con header Referer
    const response = await fetch(
      'https://pay.payphonetodoesposible.com/api/button/Prepare',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Referer': siteUrl // Agregar Referer
        },
        body: JSON.stringify(paymentData)
      }
    );

    console.log('Status de respuesta PayPhone:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));

    // Leer la respuesta como texto primero
    const responseText = await response.text();
    console.log('Respuesta PayPhone:', responseText.substring(0, 500));

    // Intentar parsear como JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ No se pudo parsear la respuesta como JSON');
      console.error('Respuesta completa:', responseText);
      return NextResponse.json(
        { 
          error: 'PayPhone devolvió una respuesta inválida',
          details: responseText.substring(0, 200)
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('❌ Error de PayPhone:', data);
      return NextResponse.json(
        { 
          error: data.message || 'Error al preparar el pago con PayPhone',
          details: data
        },
        { status: response.status }
      );
    }

    console.log('✅ Pago preparado exitosamente');
    console.log('PayWithCard URL:', data.payWithCard);
    console.log('PayWithPayPhone URL:', data.payWithPayPhone);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Error creando pago:', error);
    return NextResponse.json(
      { 
        error: 'Error al crear el pago',
        message: error.message
      },
      { status: 500 }
    );
  }
}