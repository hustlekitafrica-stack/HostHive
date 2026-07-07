import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: { message: 'OPENAI_API_KEY is not configured.' } },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { propertyType, location, amenities, basics, title } = body;

    if (!propertyType || !location) {
      return NextResponse.json(
        { error: { message: 'Property type and location are required to generate a description.' } },
        { status: 400 },
      );
    }

    const amenityList = Array.isArray(amenities) && amenities.length > 0
      ? amenities.join(', ')
      : 'not specified';

    const bedroomInfo = basics
      ? `${basics.bedrooms ?? 1} bedroom(s), ${basics.bathrooms ?? 1} bathroom(s), sleeps ${basics.maxGuests ?? 2}`
      : '';

    const locationStr = [
      location.neighbourhood,
      location.city,
      location.county,
    ].filter(Boolean).join(', ');

    const prompt = `You are a professional Kenyan short-stay / Airbnb property copywriter.

Write a compelling, warm, and inviting listing description for the following property. The description should:
- Be 150–250 words
- Highlight what makes the space special
- Mention key amenities naturally (don't just list them)
- Reference the neighbourhood / location vibe if details are provided
- Use a friendly, conversational tone suitable for Airbnb-style listings
- Be written in English
- NOT include any heading, title, or greeting — just the description body

Property details:
- Type: ${propertyType}
- Title: ${title || 'not set yet'}
- Location: ${locationStr || 'Kenya'}
- Bedrooms/Bathrooms/Guests: ${bedroomInfo || 'not specified'}
- Size: ${basics?.size ? `${basics.size} ${basics.sizeUnit || 'sq m'}` : 'not specified'}
- Amenities: ${amenityList}

Write the description now:`;

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that writes short-stay property listing descriptions for the Kenyan market.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.8,
    });

    const description = completion.choices[0]?.message?.content?.trim() || '';

    if (!description) {
      return NextResponse.json(
        { error: { message: 'AI returned an empty description. Please try again.' } },
        { status: 500 },
      );
    }

    return NextResponse.json({ description });
  } catch (err: any) {
    console.error('[AI Description]', err);
    const message = err?.message?.includes('API key')
      ? 'Invalid OpenAI API key. Please check your OPENAI_API_KEY.'
      : 'Failed to generate description. Please try again.';
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
