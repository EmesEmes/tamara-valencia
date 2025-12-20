import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { id, clientTransactionId } = await request.json();

    console.log('=== PAYPHONE CONFIRM ===');
    console.log('ID:', id);
    console.log('ClientTransactionId:', clientTransactionId);

    if (!id || !clientTransactionId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    const token = process.env.NEXT_PUBLIC_PAYPHONE_TOKEN;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    console.log('Token:', token ? 'Presente ✅' : 'FALTA ❌');
    console.log('Referer:', siteUrl);

    if (!token) {
      return NextResponse.json(
        { error: 'Token no configurado' },
        { status: 500 }
      );
    }

    // Preparar datos exactamente como en la documentación
    const bodyJSON = {
      id: parseInt(id),
      clientTxId: clientTransactionId
    };

    console.log('Body a enviar:', bodyJSON);

    // Llamar a la API de PayPhone con header Referer (como en el ejemplo)
    const response = await fetch(
      'https://pay.payphonetodoesposible.com/api/button/V2/Confirm',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Referer': document.referrer  // ← Importante, como en el ejemplo
        },
        body: JSON.stringify(bodyJSON)
      }
    );

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response Text (primeros 500 chars):', responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing response:', e);
      console.error('Response completa:', responseText);
      return NextResponse.json(
        { 
          error: 'Respuesta inválida de PayPhone',
          rawResponse: responseText.substring(0, 200)
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('Error de PayPhone:', data);
      return NextResponse.json(
        { 
          error: data.message || 'Error al confirmar pago',
          details: data
        },
        { status: response.status }
      );
    }

    console.log('✅ Pago confirmado exitosamente');
    console.log('Status Code:', data.statusCode);
    console.log('Transaction Status:', data.transactionStatus);

    // Aquí puedes agregar lógica adicional:
    // - Guardar el pedido en Supabase
    // - Actualizar stock de productos
    // - Enviar email de confirmación
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error confirmando pago:', error);
    return NextResponse.json(
      { 
        error: 'Error al confirmar el pago',
        message: error.message
      },
      { status: 500 }
    );
  }
}