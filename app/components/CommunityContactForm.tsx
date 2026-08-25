"use client";

import { FormEvent, useEffect, useState } from "react";
import { defaultHomePage, type TelegramTrainingSettings } from "../lib/home";
import { siteIdentity } from "../lib/site-context";
import { usePublicLanguage } from "./usePublicLanguage";

export function CommunityContactForm() {
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const [kind, setKind] = useState("learning-referral");
  const [training, setTraining] = useState<TelegramTrainingSettings>(defaultHomePage.telegramTraining);
  const { language } = usePublicLanguage();
  const contactEmail = siteIdentity.contactEmail;
  const my = language === "my";

  useEffect(() => {
    fetch("/api/home", { cache: "no-store", credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload) => {
        if (payload.home?.telegramTraining) setTraining(payload.home.telegramTraining);
      })
      .catch(() => undefined);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setNotice("");
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "get-involved",
          kind: form.get("kind"),
          name: form.get("name"),
          email: form.get("email"),
          organisation: form.get("organisation"),
          location: form.get("location"),
          message: form.get("message"),
          consent: form.get("consent") === "on",
          website: form.get("website"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to send your message");
      formEl.reset();
      setNotice(
        payload.message ||
          (my
            ? `ကျေးဇူးတင်ပါတယ်။ ကြိုဆိုစာ ပို့ပေးပါမည်။ သင့်စုံစမ်းမှု CK-${payload.reference} သည် ဝန်ထမ်း နောက်ဆက်တွဲ စာရင်းတွင် ဆက်ရှိပါသည်။`
            : `Thank you. A greeting is on its way. Your enquiry CK-${payload.reference} remains in the staff follow-up queue.`),
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to send your message");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <section className="official-pathways" aria-labelledby="official-pathways-title">
        <div className="official-pathways-heading">
          <p className="eyebrow">{my ? "ခွင့်ပြုထားသော လမ်းကြောင်းများ" : "Authorised pathways"}</p>
          <h2 id="official-pathways-title">
            {my ? "ရှင်းလင်းသော နောက်တစ်ဆင့်မှ စတင်ပါ။" : "Start with a clear next step."}
          </h2>
          <p>
            {my
              ? "ကိုယ်ရေး စုံစမ်းမှုများကို ဝန်ထမ်း နောက်ဆက်တွဲ စာရင်းသို့ ပို့သည်။ သင်လည်း ကြိုဆိုစာ ရရှိမည်။ ငွေပေးချေကတ် အချက်အလက်များကို ဤနေရာတွင် မကောက်ယူပါ။"
              : "Private enquiries enter the staff follow-up queue. You also receive a greeting email, like event subscribers. We do not collect payment-card details here."}
          </p>
        </div>
        <div className="official-pathway-grid">
          <article className="learning-pathway-card">
            <span>01 / {my ? "သတင်းများ" : "STORIES"}</span>
            <h3>{my ? "အတည်ပြုထားသည်ကို ဖတ်ပါ။" : "Read what has been approved."}</h3>
            <p>
              {my
                ? "သတင်း၊ ဓာတ်ပုံနှင့် အကျဉ်းချုပ်များကို စီမံခန့်ခွဲသူ ထုတ်ပြန်ပြီးမှသာ သတင်းများတွင် ပြသည်။"
                : "News, photographs and recaps appear on News & stories only after an administrator publishes them."}
            </p>
            <a href="/stories">{my ? "သတင်းများ ဖွင့်ရန် →" : "Open news and stories →"}</a>
            <small>{my ? "အယ်ဒီတာ လုပ်ငန်းစဉ်နှင့် n8n ထုတ်ပြန်မှု" : "Editorial workflow with n8n publish distribution"}</small>
          </article>
          <article className="donation-pathway-card">
            <span>02 / {my ? "လှူဒါန်းမှု" : "GIVING"}</span>
            <h3>{my ? "ထုတ်ပြန်ထားသော ကိန်းဂဏန်းဖြင့် ပေးပါ။" : "Give with published figures."}</h3>
            <p>
              {my
                ? "တောင်းခံ ပမာဏနှင့် နှစ်စဉ် စုစုပေါင်းများကို Admin တွင် ထည့်သည်။ ဤစာမျက်နှာသည် ကတ်ငွေ မကောက်ပါ။"
                : "Appeal amounts and yearly totals are entered in Admin. This page does not take card payments."}
            </p>
            <a href="/giving">{my ? "လှူဒါန်းမှု ပွင့်လင်းမှု ကြည့်ရန် →" : "See giving transparency →"}</a>
            <small>{my ? "ခွင့်ပြုထားသော ဝန်ထမ်းများက ထိန်းချုပ်သော ကိန်းဂဏန်းများ" : "Figures controlled by authorised staff"}</small>
          </article>
          {training.visible && training.url ? (
          <article className="telegram-training-card">
            <span>03 / {my ? "သင်တန်း" : "TRAINING"}</span>
            <h3>{my ? "တယ်လီဂရမ်တွင် သင်ယူပါ။" : training.title}</h3>
            <p>
              {my
                ? "PDF သင်တန်း ဘော့ကို ဖွင့်ပြီး Python နှင့် IT သင်ခန်းစာများကို တယ်လီဂရမ်တွင် ဆက်လက် လေ့လာပါ။ ဤနေရာတွင် လှူဒါန်းမှု မကောက်ပါ။"
                : training.description}
            </p>
            <a href={training.url} target="_blank" rel="noreferrer">
              {my ? "တယ်လီဂရမ် သင်တန်း ဖွင့်ရန် ↗" : `${training.cta} ↗`}
            </a>
            <small>{my ? "n8n သင်တန်း လုပ်ငန်းစဉ်" : "n8n Telegram course workflow"}</small>
          </article>
          ) : null}
        </div>
      </section>

      <section className="community-contact" id="community-contact">
      <div>
        <p className="eyebrow">{my ? "သီးသန့် လမ်းညွှန် တောင်းဆိုမှု" : "Private navigation request"}</p>
        <h2>{my ? "နောက်တစ်ဆင့် ရှာရန် အကူအညီ လိုပါသလား။" : "Would you like help finding the next step?"}</h2>
        <p>
          {my
            ? "ခွင့်ပြုထားသော ဝန်ထမ်းများက သင့်စာကို နောက်ဆက်တွဲ စာရင်းတွင် ထားရှိသည်။ ကြိုဆိုစာကိုလည်း ပို့ပေးသည်။ ဗီဇာ အခြေအနေ၊ ငွေပေးချေကတ် သို့မဟုတ် ဘဏ် အချက်အလက် မတောင်းပါ။"
            : "Authorised staff keep your enquiry in the follow-up queue and send a greeting to your inbox. We do not ask for visa status, payment-card details or bank information."}
        </p>
        <p>
          {my ? "အီးမေးလ် — " : "Mail — "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </p>
      </div>
      <form onSubmit={submit}>
        <label className="form-honeypot" aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <label>
          {my ? "စိတ်ဝင်စားသည်မှာ" : "I am interested in"}
          <select
            name="kind"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            <option value="learning-referral">{my ? "အတည်ပြု အင်္ဂလိပ် စာသင်ခန်း ရှာရန်" : "Help finding authorised English classes"}</option>
            <option value="donation-enquiry">{my ? "လှူဒါန်းမှု သို့မဟုတ် ရန်ပုံငွေ စုံစမ်းမှု" : "Donation or funding enquiry"}</option>
            <option value="volunteer">{my ? "စေတနာ့ဝန်ထမ်း" : "Volunteering"}</option>
            <option value="partnership">{my ? "မိတ်ဖက်မှု" : "Partnership"}</option>
            <option value="contact">{my ? "အထွေထွေ ဆက်သွယ်ရန်" : "General contact"}</option>
          </select>
        </label>
        <label>
          {my ? "အမည်" : "Name"}
          <input name="name" required minLength={2} maxLength={100} autoComplete="name" />
        </label>
        <label>
          {my ? "အီးမေးလ်" : "Email"}
          <input name="email" type="email" required maxLength={254} autoComplete="email" />
        </label>
        <label>
          {my ? "အဖွဲ့အစည်း (ရွေးချယ်နိုင်)" : "Organisation (optional)"}
          <input name="organisation" maxLength={140} autoComplete="organization" />
        </label>
        <label>
          {my ? "ဆင်ခြေဖုံး၊ မြို့ သို့မဟုတ် ဒေသ (ရွေးချယ်နိုင်)" : "Australian suburb, city or region (optional)"}
          <input name="location" maxLength={140} autoComplete="address-level2" />
        </label>
        <label className="message-field">
          {kind === "learning-referral"
            ? my
              ? "စာသင်ခန်း ရှာရန် မည်သည့် အကူအညီ လိုသနည်း။"
              : "What help do you need finding a class?"
            : kind === "donation-enquiry"
              ? my
                ? "အဖွဲ့ကို မည်သို့ ထောက်ပံ့လိုသနည်း။"
                : "How would you like to support the organisation?"
              : my
                ? "စာ"
                : "Message"}
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={3000}
            rows={5}
            placeholder={
              kind === "learning-referral"
                ? my
                  ? "ဥပမာ — နှစ်သက်သော နေရာ။ ဗီဇာ စာရွက်စာတမ်း မထည့်ပါနှင့်။"
                  : "For example: your preferred area or help locating an authorised provider. Do not include visa documents."
                : kind === "donation-enquiry"
                  ? my
                    ? "အနာဂတ် ထောက်ပံ့မှုအကြောင်း မေးပါ။ ကတ်၊ ဘဏ် သို့မဟုတ် ငွေပေးချေမှု အသေးစိတ် မထည့်ပါနှင့်။"
                    : "Ask a question about future support. Do not include card, bank or payment details."
                  : my
                    ? "ခွင့်ပြုထားသော ဝန်ထမ်းများ မည်သို့ ကူညီနိုင်သည်ကို ရေးပါ။"
                    : "Tell authorised staff how they may help."
            }
          />
        </label>
        <label className="consent-check">
          <input name="consent" type="checkbox" required />
          <span>
            {my
              ? "ဤစုံစမ်းမှုကို ပြန်လည် ဆက်သွယ်ရန် ခွင့်ပြုထားသော ဝန်ထမ်းများက ဤအချက်အလက်များကို အသုံးပြုရန် သဘောတူပါသည်။"
              : "I consent to authorised staff using these details to respond to this inquiry."}
          </span>
        </label>
        <button type="submit" disabled={sending}>
          {sending ? (my ? "ပို့နေသည်…" : "Sending…") : my ? "လုံခြုံစွာ ပို့ရန် →" : "Send securely →"}
        </button>
        {notice && <p className="contact-notice" role="status">{notice}</p>}
      </form>
      </section>
    </>
  );
}
