/* eslint-disable @next/next/no-head-element */
import type React from "react";
import BaseTable from "../../components/BaseTable";
import EmailHead from "../../components/EmailHead";
import EmailScheduledBodyHeaderContent from "../../components/EmailScheduledBodyHeaderContent";
import EmailSchedulingBodyDivider from "../../components/EmailSchedulingBodyDivider";
import type { BodyHeadType } from "../../components/EmailSchedulingBodyHeader";
import RawHtml from "../../components/RawHtml";
import Row from "../../components/Row";

const Html = (props: { children: React.ReactNode }) => (
  <>
    <RawHtml html="<!doctype html>" />
    <html>{props.children}</html>
  </>
);

export const ThotisBaseEmail = (props: {
  children: React.ReactNode;
  callToAction?: React.ReactNode;
  subject: string;
  title?: string;
  subtitle?: React.ReactNode | string;
  headerType?: BodyHeadType;
  hideLogo?: boolean;
}) => {
  // Thotis Colors
  const THOTIS_BLUE = "#004E89";
  const THOTIS_ORANGE = "#FF6B35";
  const BACKGROUND_COLOR = "#F3F4F6";
  const SURFACE_COLOR = "#FFFFFF";
  const FONT_FAMILY = "Montserrat, Inter, Roboto, Helvetica, sans-serif";

  return (
    <Html>
      <EmailHead title={props.subject} />
      <body style={{ wordSpacing: "normal", backgroundColor: BACKGROUND_COLOR }}>
        <div style={{ backgroundColor: BACKGROUND_COLOR }}>
          <RawHtml
            html={`<!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->`}
          />
          <div style={{ margin: "0px auto", maxWidth: 600 }}>
            <Row align="center" border="0" style={{ width: "100%" }}>
              <td
                style={{
                  direction: "ltr",
                  fontSize: "0px",
                  padding: "0px",
                  paddingTop: "40px",
                  textAlign: "center",
                }}>
                <RawHtml
                  html={`<!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr></tr></table><![endif]-->`}
                />
              </td>
            </Row>
          </div>
          <div
            style={{
              margin: "0px auto",
              maxWidth: 600,
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
              padding: "2px",
              backgroundColor: SURFACE_COLOR,
            }}>
            {/* Custom Thotis Header if needed, or use existing generic headers */}
            <div style={{ padding: "20px", textAlign: "center", borderBottom: `4px solid ${THOTIS_ORANGE}` }}>
              {/* Placeholder for Thotis SVG Logo if we had one, for now text or standard logo */}
              <h1 style={{ color: THOTIS_BLUE, fontFamily: FONT_FAMILY, margin: 0, fontSize: "24px" }}>
                THOTIS
              </h1>
            </div>

            {/* Existing header logic as fallback or supplementary */}
            {/*
            {props.headerType && (
              <EmailSchedulingBodyHeader headerType={props.headerType} headStyles={{ border: 0 }} />
            )}
            */}

            {props.title && (
              <EmailScheduledBodyHeaderContent
                headStyles={{ border: 0 }}
                title={props.title}
                subtitle={props.subtitle}
              />
            )}

            <EmailSchedulingBodyDivider headStyles={{ border: 0 }} />

            <RawHtml
              html={`<!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" className="" style="width:600px;" width="600" bgcolor="#FFFFFF" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->`}
            />
            <div
              style={{
                background: SURFACE_COLOR,
                backgroundColor: SURFACE_COLOR,
                margin: "0px auto",
                maxWidth: 600,
              }}>
              <Row
                align="center"
                border="0"
                style={{ background: SURFACE_COLOR, backgroundColor: SURFACE_COLOR, width: "100%" }}>
                <td
                  style={{
                    direction: "ltr",
                    fontSize: 0,
                    padding: 0,
                    textAlign: "center",
                  }}>
                  <RawHtml
                    html={`<!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td className="" style="vertical-align:top;width:598px;" ><![endif]-->`}
                  />
                  <div
                    className="mj-column-per-100 mj-outlook-group-fix"
                    style={{
                      fontSize: 0,
                      textAlign: "left",
                      direction: "ltr",
                      display: "inline-block",
                      verticalAlign: "top",
                      width: "100%",
                    }}>
                    <Row border="0" style={{ verticalAlign: "top" }} width="100%">
                      <td align="left" style={{ fontSize: 0, padding: "10px 25px", wordBreak: "break-word" }}>
                        <div
                          style={{
                            fontFamily: FONT_FAMILY,
                            fontSize: 16,
                            fontWeight: 500,
                            lineHeight: 1.5,
                            textAlign: "left",
                            color: "#101010",
                          }}>
                          {props.children}
                        </div>
                      </td>
                    </Row>
                  </div>
                  <RawHtml html="<!--[if mso | IE]></td></tr></table><![endif]-->" />
                </td>
              </Row>
            </div>
            {props.callToAction && <EmailSchedulingBodyDivider headStyles={{ border: 0 }} />}
            <RawHtml
              html={`<!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" className="" style="width:600px;" width="600" bgcolor="#FFFFFF" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->`}
            />

            <div
              style={{
                background: SURFACE_COLOR,
                backgroundColor: SURFACE_COLOR,
                margin: "0px auto",
                maxWidth: 600,
              }}>
              <Row
                align="center"
                border="0"
                style={{ background: SURFACE_COLOR, backgroundColor: SURFACE_COLOR, width: "100%" }}>
                <td
                  style={{
                    direction: "ltr",
                    fontSize: 0,
                    padding: 0,
                    textAlign: "center",
                  }}>
                  <RawHtml
                    html={`<!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td className="" style="vertical-align:top;width:598px;" ><![endif]-->`}
                  />
                  {props.callToAction && (
                    <div
                      className="mj-column-per-100 mj-outlook-group-fix"
                      style={{
                        fontSize: 0,
                        textAlign: "left",
                        direction: "ltr",
                        display: "inline-block",
                        verticalAlign: "top",
                        width: "100%",
                      }}>
                      <BaseTable border="0" style={{ verticalAlign: "top" }} width="100%">
                        <tbody>
                          <tr>
                            <td
                              align="center"
                              vertical-align="middle"
                              style={{ fontSize: 0, padding: "10px 25px", wordBreak: "break-word" }}>
                              {props.callToAction}
                            </td>
                          </tr>
                        </tbody>
                      </BaseTable>
                    </div>
                  )}
                  <RawHtml html="<!--[if mso | IE]></td></tr></table><![endif]-->" />
                </td>
              </Row>
            </div>
          </div>
          {/* Custom Thotis Footer */}
          <div
            style={{
              marginTop: "20px",
              textAlign: "center",
              fontFamily: FONT_FAMILY,
              color: "#6B7280",
              fontSize: "12px",
            }}>
            <p>&copy; {new Date().getFullYear()} Thotis. All rights reserved.</p>
          </div>
          <RawHtml html="<!--[if mso | IE]></td></tr></table><![endif]-->" />
        </div>
      </body>
    </Html>
  );
};
