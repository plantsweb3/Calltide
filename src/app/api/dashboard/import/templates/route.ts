import { NextRequest, NextResponse } from "next/server";

const TEMPLATES: Record<string, { filename: string; content: string }> = {
  customers: {
    filename: "calltide-customers-template.csv",
    content: `Name,Phone,Email,Address,Notes,Tags,Language
EXAMPLE - John Smith,5125550100,john@example.com,"123 Main St, Austin TX",Regular customer,plumbing;residential,en
EXAMPLE - Maria Garcia,2105550100,maria@example.com,"456 Oak Ave, San Antonio TX",Prefers Spanish,hvac;commercial,es`,
  },
  appointments: {
    filename: "calltide-appointments-template.csv",
    content: `Customer Phone,Customer Name,Date,Time,Service,Duration,Notes,Status
5125550100,EXAMPLE - John Smith,03/15/2026,10:00 AM,AC Repair,60,Annual maintenance,confirmed
2105550100,EXAMPLE - Maria Garcia,2026-03-20,14:00,Plumbing Inspection,90,Kitchen sink,confirmed`,
  },
  estimates: {
    filename: "calltide-estimates-template.csv",
    content: `Customer Phone,Service,Description,Amount,Notes,Status
5125550100,AC Unit Replacement,Replace 3-ton unit with 4-ton,$4500.00,Includes 10-year warranty,sent
2105550100,Pipe Repair,Fix leak under kitchen sink,$350.00,Quoted on-site,new`,
  },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (!type || !TEMPLATES[type]) {
    return NextResponse.json(
      { error: "Invalid template type. Use: customers, appointments, or estimates" },
      { status: 400 }
    );
  }

  const template = TEMPLATES[type];

  return new NextResponse(template.content, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${template.filename}"`,
    },
  });
}
