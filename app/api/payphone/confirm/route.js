import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { id, clientTransactionId } = await request.json();

    if (!id || !clientTransactionId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    const response = await fetch(
      'https://pay.payphonetodoesposible.com/api/button/V2/Confirm',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PAYPHONE_TOKEN}`
        },
        body: JSON.stringify({
          id: parseInt(id),
          clientTxId: clientTransactionId
        })
      }
    );

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error confirmando pago:', error);
    return NextResponse.json(
      { error: 'Error al confirmar el pago' },
      { status: 500 }
    );
  }
}
