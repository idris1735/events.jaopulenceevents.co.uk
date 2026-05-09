import { requireAdminSession } from "@/lib/auth";
import { getAdminTickets } from "@/lib/data";

export default async function AdminTicketsPage() {
  await requireAdminSession();
  const tickets = await getAdminTickets();

  const issued  = tickets.filter((t) => t.status === "issued").length;
  const used    = tickets.filter((t) => t.status === "used").length;
  const voided  = tickets.filter((t) => t.status === "void").length;

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          marginBottom: "2rem",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div>
          <p className="kicker" style={{ marginBottom: "0.3rem" }}>Tickets</p>
          <h1 className="section-title" style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>
            Issued credentials
          </h1>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--faint)" }}>
            {tickets.length} total
          </p>
        </div>

        {/* Status summary pills */}
        {tickets.length > 0 && (
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <span className="status-pill" data-status="issued">{issued} issued</span>
            {used > 0   && <span className="status-pill" data-status="used">{used} used</span>}
            {voided > 0 && <span className="status-pill" data-status="void">{voided} void</span>}
          </div>
        )}
      </div>

      <div className="table-wrapper">
        <div className="table-scroll">
          <table className="table" style={{ minWidth: "580px" }}>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Event</th>
                <th>Ticket ID</th>
                <th>Status</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: "center", color: "var(--faint)", padding: "3rem 2rem" }}
                  >
                    No tickets issued yet.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td style={{ fontWeight: 600, fontSize: "0.9rem" }}>{ticket.guest_name}</td>
                    <td style={{ color: "var(--muted)", fontSize: "0.86rem" }}>{ticket.event_name}</td>
                    <td>
                      <code
                        style={{
                          fontSize: "0.74rem",
                          color: "var(--muted)",
                          fontFamily: "monospace",
                          background: "rgba(255,255,255,0.04)",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "5px",
                          display: "inline-block",
                          letterSpacing: "0.03em"
                        }}
                      >
                        {ticket.public_id}
                      </code>
                    </td>
                    <td>
                      <span className="status-pill" data-status={ticket.status}>
                        {ticket.status}
                      </span>
                    </td>
                    <td>
                      {ticket.pdf_path ? (
                        <a
                          href={ticket.pdf_path}
                          target="_blank"
                          rel="noreferrer"
                          className="button-ghost"
                          style={{
                            padding: "0.3rem 0.75rem",
                            borderRadius: "8px",
                            fontSize: "0.76rem",
                            minHeight: "auto",
                            display: "inline-flex"
                          }}
                        >
                          Download
                        </a>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.76rem",
                            color: "var(--faint)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem"
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              border: "1.5px solid rgba(212,175,55,0.3)",
                              display: "inline-block"
                            }}
                          />
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
