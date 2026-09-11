"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaPicker } from "@/components/dashboard/media-picker";
import type { MediaItem } from "@/features/media/types";
import { discardSiteBrandingDraft, publishSiteBranding, saveSiteFooterDraft, saveSiteHeaderDraft, saveSiteIdentityDraft, saveSiteMenusDraft, type SettingsActionResult } from "@/features/settings/actions";
import type { SiteSettingsDocument } from "@/features/settings/queries";
import type { FooterBlock, FooterColumn, FooterLayout, NamedMenu, MenuItem } from "@/features/settings/types";

type Locale = "ar" | "en";
type Section = "identity" | "header" | "menus" | "footer";
type Props = { initial: SiteSettingsDocument; media: MediaItem[]; section?: Section };

type Copy = Record<string, string> & { locale: string; identity: string; identityDescription: string; header: string; headerDescription: string; menus: string; menusDescription: string; footer: string; footerDescription: string; quickLinks: string; siteName: string; tagline: string; footerText: string; logo: string; favicon: string; menu: string; menuName: string; menuPlacement: string; assignment: string; noAssignment: string; parent: string; noParent: string; visible: string; headerMenu: string; footerMenu: string; addMenu: string; addItem: string; item: string; label: string; url: string; urlPlaceholder: string; openNewTab: string; addColumn: string; column: string; heading: string; assignedMenu: string; noMenu: string; addBlock: string; text: string; contact: string; socialLinks: string; title: string; phone: string; email: string; address: string; value: string; platform: string; remove: string; moveUp: string; moveDown: string; saveDraft: string; publish: string; discard: string; saving: string; saved: string; published: string; empty: string; publicHome: string; menuItems: string; unsupportedLinks: string };

const copy: Record<Locale, Copy> = {
  ar: { locale: "العربية", identity: "هوية الموقع", identityDescription: "اسم الموقع وشعاره وأصوله الإعلامية.", header: "رأس الصفحة", headerDescription: "اختر قائمة الرأس واضبط روابط الوصول العامة.", menus: "القوائم", menusDescription: "أنشئ القوائم وأدر عناصرها وترتيبها من مكان واحد.", footer: "تذييل الصفحة", footerDescription: "حرر أعمدة التذييل العامة: العلامة التجارية، الروابط السريعة، والتواصل.", quickLinks: "روابط سريعة", siteName: "اسم الموقع", tagline: "الشعار التعريفي", footerText: "نص التذييل", logo: "الشعار", favicon: "أيقونة الموقع", menu: "القائمة", menuName: "اسم القائمة", menuPlacement: "الموضع", assignment: "التعيين", noAssignment: "بدون تعيين", parent: "العنصر الأب", noParent: "بدون عنصر أب", visible: "ظاهر", headerMenu: "قائمة الرأس", footerMenu: "قائمة التذييل", addMenu: "إضافة قائمة", addItem: "إضافة عنصر", item: "العنصر", label: "التسمية", url: "الرابط", urlPlaceholder: "/about أو https://example.com", openNewTab: "فتح في نافذة جديدة", addColumn: "إضافة عمود", column: "العمود", heading: "عنوان العمود", assignedMenu: "القائمة المرتبطة", noMenu: "بدون قائمة", addBlock: "إضافة كتلة", text: "نص", contact: "تواصل", socialLinks: "روابط اجتماعية", title: "العنوان", phone: "الهاتف", email: "البريد الإلكتروني", address: "العنوان", value: "القيمة", platform: "المنصة", remove: "حذف", moveUp: "نقل لأعلى", moveDown: "نقل لأسفل", saveDraft: "حفظ المسودة", publish: "نشر", discard: "تجاهل", saving: "جارٍ الحفظ…", saved: "تم حفظ المسودة.", published: "تم النشر.", empty: "لا توجد عناصر بعد.", publicHome: "فتح الصفحة العامة", menuItems: "عناصر القائمة", unsupportedLinks: "مجموعة روابط مرتبطة بقائمة؛ تُدار من تبويب القوائم." },
  en: { locale: "English", identity: "Site identity", identityDescription: "Manage the site name, logo, and media assets.", header: "Header", headerDescription: "Assign the header menu and configure public access links.", menus: "Menus", menusDescription: "Create menus and manage their items and order in one place.", footer: "Footer", footerDescription: "Edit the public Brand, Quick links, and Contact columns.", quickLinks: "Quick links", siteName: "Site name", tagline: "Tagline", footerText: "Footer text", logo: "Logo", favicon: "Favicon", menu: "Menu", menuName: "Menu name", menuPlacement: "Placement", assignment: "Assignment", noAssignment: "No assignment", parent: "Parent item", noParent: "No parent", visible: "Visible", headerMenu: "Header menu", footerMenu: "Footer menu", addMenu: "Add menu", addItem: "Add item", item: "Item", label: "Label", url: "URL", urlPlaceholder: "/about or https://example.com", openNewTab: "Open in new tab", addColumn: "Add column", column: "Column", heading: "Column heading", assignedMenu: "Assigned menu", noMenu: "No menu", addBlock: "Add block", text: "Text", contact: "Contact", socialLinks: "Social links", title: "Title", phone: "Phone", email: "Email", address: "Address", value: "Value", platform: "Platform", remove: "Remove", moveUp: "Move up", moveDown: "Move down", saveDraft: "Save draft", publish: "Publish", discard: "Discard", saving: "Saving…", saved: "Draft saved.", published: "Published.", empty: "Nothing here yet.", publicHome: "Open public page", menuItems: "Menu items", unsupportedLinks: "Linked menu items are managed in Menus." },
};

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const ordered = <T extends { sortOrder: number }>(items: T[]) => items.map((item, index) => ({ ...item, sortOrder: index }));
const localePath = (locale: Locale) => `/${locale}`;
const canonicalFooterMenuKey = "footer-quick-links";

function normalizeFooterLayouts(layouts: SiteSettingsDocument["footerLayouts"]) {
  return layouts.map((layout) => ({
    ...layout,
    columns: layout.columns.map((column) => {
      return {
        ...column,
        // The canonical footer menu belongs exclusively to the canonical
        // Quick links column; every other column is always content-only.
        assignedMenuKey: column.columnKey === "quick-links" && column.assignedMenuKey === canonicalFooterMenuKey
          ? canonicalFooterMenuKey
          : null,
        blocks: column.blocks.map((block) => block.blockType === "contact" ? { ...block, items: contactItems(copy[layout.locale], block.items) } : block),
      };
    }),
  }));
}

export function SiteSettingsEditor({ initial, media, section = "identity" }: Props) {
  const [value, setValue] = useState(initial);
  const [locale, setLocale] = useState<Locale>("ar");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const labels = copy[locale];
  const update = (next: SiteSettingsDocument) => { setValue(next); setMessage(null); };
  const save = (action: () => Promise<SettingsActionResult>, success: string) => startTransition(async () => { const result = await action(); setMessage(result.ok ? success : result.message); if (result.ok) setValue((current) => ({ ...current, revisionToken: result.revisionToken })); });
  const payload = () => ({ id: value.id, brandingKey: "default" as const, revisionToken: value.revisionToken, logoMediaId: value.logoMediaId, faviconMediaId: value.faviconMediaId, localizations: (Object.entries(value.locales) as [Locale, typeof value.locales.ar][]).map(([itemLocale, item]) => ({ locale: itemLocale, ...item })), menus: value.menus, navigation: [], footerLayouts: normalizeFooterLayouts(value.footerLayouts) });
  const saveCurrent = () => {
    if (section === "identity") return saveSiteIdentityDraft({ id: value.id, revisionToken: value.revisionToken, logoMediaId: value.logoMediaId, faviconMediaId: value.faviconMediaId, localizations: (Object.entries(value.locales) as [Locale, typeof value.locales.ar][]).map(([itemLocale, item]) => ({ locale: itemLocale, ...item })) });
    if (section === "header") return saveSiteHeaderDraft({ id: value.id, revisionToken: value.revisionToken, menuKeys: { ar: value.menus.find((menu) => menu.locale === "ar" && menu.placement === "header" && menu.assignmentKey === "header-primary")?.menuKey ?? value.menus.find((menu) => menu.locale === "ar" && menu.placement === "header")?.menuKey ?? "", en: value.menus.find((menu) => menu.locale === "en" && menu.placement === "header" && menu.assignmentKey === "header-primary")?.menuKey ?? value.menus.find((menu) => menu.locale === "en" && menu.placement === "header")?.menuKey ?? "" } });
    if (section === "menus") return saveSiteMenusDraft({ id: value.id, revisionToken: value.revisionToken, menus: value.menus });
    return saveSiteFooterDraft({ id: value.id, revisionToken: value.revisionToken, footerLayouts: normalizeFooterLayouts(value.footerLayouts) });
  };
  const saveAll = (kind: "draft" | "publish") => kind === "publish" ? save(() => publishSiteBranding(payload()), labels.published) : save(saveCurrent, labels.saved);
  const discard = () => startTransition(async () => { const result = await discardSiteBrandingDraft(value.id, "default", value.revisionToken); setMessage(result.ok ? (locale === "ar" ? "تم تجاهل المسودة." : "Draft discarded.") : result.message); if (result.ok) window.location.reload(); });
  const title = section === "identity" ? labels.identity : section === "header" ? labels.header : section === "menus" ? labels.menus : labels.footer;

  return <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-28 md:p-8" dir={locale === "ar" ? "rtl" : "ltr"}>
    <header><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight">{title}</h1><p className="mt-2 text-muted-foreground">{section === "identity" ? labels.identityDescription : section === "header" ? labels.headerDescription : section === "menus" ? labels.menusDescription : labels.footerDescription}</p></div><div className="flex gap-2"><Button type="button" size="sm" variant={locale === "ar" ? "default" : "outline"} onClick={() => setLocale("ar")}>العربية</Button><Button type="button" size="sm" variant={locale === "en" ? "default" : "outline"} onClick={() => setLocale("en")}>English</Button></div></div></header>
    {section === "identity" && <Identity value={value} locale={locale} labels={labels} media={media} update={update} />}
    {section === "header" && <Header value={value} locale={locale} labels={labels} update={update} />}
    {section === "menus" && <Menus value={value} locale={locale} labels={labels} update={update} />}
    {section === "footer" && <Footer value={value} locale={locale} labels={labels} media={media} update={update} />}
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 shadow-lg backdrop-blur"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3"><span role="status" className="text-sm text-muted-foreground">{pending ? labels.saving : message}</span><div className="flex gap-2"><Button type="button" variant="outline" disabled={pending} onClick={discard}>{labels.discard}</Button><Button type="button" variant="outline" disabled={pending} onClick={() => saveAll("draft")}><Save aria-hidden="true" />{labels.saveDraft}</Button><Button type="button" disabled={pending} onClick={() => saveAll("publish")}>{labels.publish}</Button></div></div></div>
  </main>;
}

function Identity({ value, locale, labels, media, update }: { value: SiteSettingsDocument; locale: Locale; labels: Copy; media: MediaItem[]; update: (value: SiteSettingsDocument) => void }) {
  const text = value.locales[locale];
  const setText = (field: "siteName" | "tagline", next: string) => update({ ...value, locales: { ...value.locales, [locale]: { ...text, [field]: next } } });
  return <Card><CardHeader><CardTitle>{labels.identity}</CardTitle><CardDescription>{labels.identityDescription}</CardDescription></CardHeader><CardContent className="grid gap-5 md:grid-cols-2"><Field label={labels.siteName}><Input value={text.siteName} onChange={(event) => setText("siteName", event.target.value)} /></Field><Field label={labels.tagline}><Input value={text.tagline ?? ""} onChange={(event) => setText("tagline", event.target.value)} /></Field><MediaPicker items={media} selectedId={value.logoMediaId} locale={locale} label={labels.logo} allowExternalUrl={false} onChange={(selection) => update({ ...value, logoMediaId: selection.mediaId })} /><MediaPicker items={media} selectedId={value.faviconMediaId} locale={locale} label={labels.favicon} allowExternalUrl={false} onChange={(selection) => update({ ...value, faviconMediaId: selection.mediaId })} /></CardContent></Card>;
}

function Header({ value, locale, labels, update }: { value: SiteSettingsDocument; locale: Locale; labels: Copy; update: (value: SiteSettingsDocument) => void }) {
  const menus = value.menus.filter((menu) => menu.locale === locale && menu.placement === "header");
  const selected = menus.find((menu) => menu.assignmentKey === "header-primary")?.menuKey ?? menus[0]?.menuKey ?? "";
  const assign = (menuKey: string) => update({ ...value, menus: value.menus.map((menu) => menu.locale === locale && menu.placement === "header" ? { ...menu, assignmentKey: menu.menuKey === menuKey ? "header-primary" : null } : menu) });
  return <div className="grid gap-6 lg:grid-cols-[1fr_320px]"><Card><CardHeader><CardTitle>{labels.headerMenu}</CardTitle><CardDescription>{labels.headerDescription}</CardDescription></CardHeader><CardContent className="space-y-4"><Field label={labels.menu}><Select value={selected} onValueChange={(next) => assign(next ?? "")}><SelectTrigger className="w-full"><SelectValue placeholder={labels.noMenu} /></SelectTrigger><SelectContent>{menus.map((menu) => <SelectItem key={menu.menuKey} value={menu.menuKey}>{menu.name}</SelectItem>)}</SelectContent></Select></Field>{!menus.length && <Empty text={labels.empty} />}</CardContent></Card><Card><CardHeader><CardTitle>{labels.publicHome}</CardTitle></CardHeader><CardContent className="space-y-2">{(["ar", "en"] as Locale[]).map((itemLocale) => <a key={itemLocale} href={localePath(itemLocale)} target="_blank" rel="noreferrer" className="flex h-8 w-full items-center justify-between rounded-lg border border-input px-3 text-sm font-medium transition-colors hover:bg-accent">{copy[itemLocale].locale}<ExternalLink aria-hidden="true" className="size-4" /></a>)}</CardContent></Card></div>;
}

function Menus({ value, locale, labels, update }: { value: SiteSettingsDocument; locale: Locale; labels: Copy; update: (value: SiteSettingsDocument) => void }) {
  const menus = value.menus.filter((menu) => menu.locale === locale);
  const change = (next: NamedMenu[]) => update({ ...value, menus: [...value.menus.filter((menu) => menu.locale !== locale), ...next] });
  const add = () => change([...menus, { menuKey: uid("menu"), name: "", locale, placement: "header", assignmentKey: null, items: [] }]);
  return <div className="space-y-4"><div className="flex justify-end"><Button type="button" onClick={add}><Plus aria-hidden="true" />{labels.addMenu}</Button></div>{menus.length ? menus.map((menu) => <MenuEditor key={menu.menuKey} menu={menu} labels={labels} onChange={(next) => change(menus.map((candidate) => candidate.menuKey === menu.menuKey ? next : candidate))} onRemove={() => change(menus.filter((candidate) => candidate.menuKey !== menu.menuKey))} />) : <Empty text={labels.empty} />}</div>;
}

function MenuEditor({ menu, labels, onChange, onRemove }: { menu: NamedMenu; labels: Copy; onChange: (menu: NamedMenu) => void; onRemove: () => void }) {
  const changeItems = (items: MenuItem[]) => onChange({ ...menu, items: ordered(items) });
  const add = () => changeItems([...menu.items, { itemKey: uid("item"), parentKey: null, sortOrder: menu.items.length, label: "", href: "/", visible: true, target: "_self" }]);
  return <Card><CardHeader className="pb-3"><div className="flex flex-wrap items-center gap-3"><Input className="max-w-sm" value={menu.name} placeholder={labels.menuName} onChange={(event) => onChange({ ...menu, name: event.target.value })} /><Select value={menu.placement} onValueChange={(next) => onChange({ ...menu, placement: (next ?? "header") as "header" | "footer", assignmentKey: next === "footer" && menu.assignmentKey === "header-primary" ? null : menu.assignmentKey })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="header">{labels.headerMenu}</SelectItem><SelectItem value="footer">{labels.footerMenu}</SelectItem></SelectContent></Select><Field label={labels.assignment}><Input className="w-36" value={menu.assignmentKey ?? ""} placeholder={labels.noAssignment} onChange={(event) => onChange({ ...menu, assignmentKey: event.target.value.trim() || null })} /></Field><Button type="button" size="icon" variant="ghost" className="ms-auto" aria-label={labels.remove} onClick={onRemove}><Trash2 aria-hidden="true" /></Button></div></CardHeader><CardContent className="space-y-2"><div className="flex items-center justify-between text-sm font-medium"><span>{labels.menuItems}</span><Button type="button" size="sm" variant="outline" onClick={add}><Plus aria-hidden="true" />{labels.addItem}</Button></div>{menu.items.length ? menu.items.map((item, index) => <MenuItemRow key={item.itemKey} item={item} siblings={menu.items} index={index} count={menu.items.length} labels={labels} onChange={(next) => changeItems(menu.items.map((candidate) => candidate.itemKey === item.itemKey ? next : candidate))} onRemove={() => changeItems(menu.items.filter((candidate) => candidate.itemKey !== item.itemKey))} onMove={(direction) => { const next = [...menu.items]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; changeItems(next); }} />) : <Empty text={labels.empty} />}</CardContent></Card>;
}

function MenuItemRow({ item, siblings, index, count, labels, onChange, onRemove, onMove }: { item: MenuItem; siblings: MenuItem[]; index: number; count: number; labels: Copy; onChange: (item: MenuItem) => void; onRemove: () => void; onMove: (direction: number) => void }) {
  return <details className="group rounded-lg border bg-muted/20"><summary className="flex cursor-pointer list-none items-center gap-2 p-2"><span className="min-w-0 flex-1 truncate text-sm font-medium">{item.label || labels.item}</span><span className="text-xs text-muted-foreground">{item.href}</span><Button type="button" size="icon" variant="ghost" disabled={!index} aria-label={labels.moveUp} onClick={(event) => { event.preventDefault(); onMove(-1); }}><ArrowUp aria-hidden="true" /></Button><Button type="button" size="icon" variant="ghost" disabled={index === count - 1} aria-label={labels.moveDown} onClick={(event) => { event.preventDefault(); onMove(1); }}><ArrowDown aria-hidden="true" /></Button><Button type="button" size="icon" variant="ghost" aria-label={labels.remove} onClick={(event) => { event.preventDefault(); onRemove(); }}><Trash2 aria-hidden="true" /></Button></summary><div className="grid gap-3 border-t p-3 md:grid-cols-2"><Field label={labels.label}><Input value={item.label} onChange={(event) => onChange({ ...item, label: event.target.value })} /></Field><Field label={labels.url}><Input value={item.href} placeholder={labels.urlPlaceholder} onChange={(event) => onChange({ ...item, href: event.target.value })} /></Field><Field label={labels.parent}><Select value={item.parentKey ?? "none"} onValueChange={(next) => onChange({ ...item, parentKey: !next || next === "none" ? null : next })}><SelectTrigger className="w-full"><SelectValue placeholder={labels.noParent} /></SelectTrigger><SelectContent><SelectItem value="none">{labels.noParent}</SelectItem>{siblings.filter((candidate) => candidate.itemKey !== item.itemKey).map((candidate) => <SelectItem key={candidate.itemKey} value={candidate.itemKey}>{candidate.label || labels.item}</SelectItem>)}</SelectContent></Select></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.visible} onChange={(event) => onChange({ ...item, visible: event.target.checked })} />{labels.visible}</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.target === "_blank"} onChange={(event) => onChange({ ...item, target: event.target.checked ? "_blank" : "_self" })} />{labels.openNewTab}</label></div></details>;
}

type FooterRole = "brand" | "quick-links" | "contact";
const footerRoles: FooterRole[] = ["brand", "quick-links", "contact"];
const footerRole = (column: FooterColumn, index: number): FooterRole => footerRoles.includes(column.columnKey as FooterRole) ? column.columnKey as FooterRole : footerRoles[index] ?? "contact";

function Footer({ value, locale, labels, media, update }: { value: SiteSettingsDocument; locale: Locale; labels: Copy; media: MediaItem[]; update: (value: SiteSettingsDocument) => void }) {
  const layout = value.footerLayouts.find((item) => item.locale === locale) ?? { locale, columns: [] };
  // Footer assignment is intentionally limited to the one canonical menu.
  const menus = value.menus.filter((menu) => menu.locale === locale && menu.placement === "footer" && menu.menuKey === canonicalFooterMenuKey);
  const change = (next: FooterLayout) => update({ ...value, footerLayouts: [...value.footerLayouts.filter((item) => item.locale !== locale), next] });
  const addColumn = () => {
    const missing = footerRoles.find((role) => !layout.columns.some((column) => footerRole(column, layout.columns.indexOf(column)) === role));
    if (!missing) return;
    change({ ...layout, columns: ordered([...layout.columns, { columnKey: missing, sortOrder: layout.columns.length, heading: null, assignedMenuKey: null, blocks: [] }]) });
  };
  return <Card><CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>{labels.footer}</CardTitle><CardDescription>{labels.footerDescription}</CardDescription></div><Button type="button" size="sm" variant="outline" disabled={layout.columns.length >= footerRoles.length} onClick={addColumn}><Plus aria-hidden="true" />{labels.addColumn}</Button></div></CardHeader><CardContent className="space-y-3">{layout.columns.length ? layout.columns.map((column, index) => <FooterColumnEditor key={column.columnKey} column={column} role={footerRole(column, index)} index={index} count={layout.columns.length} menus={menus} media={media} labels={labels} value={value} locale={locale} onLogoChange={(mediaId) => update({ ...value, logoMediaId: mediaId })} onBrandDescriptionChange={(text) => update({ ...value, locales: { ...value.locales, [locale]: { ...value.locales[locale], footerText: text } } })} onChange={(next) => change({ ...layout, columns: ordered(layout.columns.map((candidate) => candidate.columnKey === column.columnKey ? next : candidate)) })} onRemove={() => change({ ...layout, columns: ordered(layout.columns.filter((candidate) => candidate.columnKey !== column.columnKey)) })} onMove={(direction) => { const next = [...layout.columns]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; change({ ...layout, columns: ordered(next) }); }} />) : <Empty text={labels.empty} />}</CardContent></Card>;
}

function FooterColumnEditor({ column, role, index, count, menus, media, labels, value, locale, onLogoChange, onBrandDescriptionChange, onChange, onRemove, onMove }: { column: FooterColumn; role: FooterRole; index: number; count: number; menus: NamedMenu[]; media: MediaItem[]; labels: Copy; value: SiteSettingsDocument; locale: Locale; onLogoChange: (mediaId: string | null) => void; onBrandDescriptionChange: (text: string) => void; onChange: (column: FooterColumn) => void; onRemove: () => void; onMove: (direction: number) => void }) {
  const contactBlock = column.blocks.find((block): block is Extract<FooterBlock, { blockType: "contact" }> => block.blockType === "contact");
  const descriptionBlock = column.blocks.find((block): block is Extract<FooterBlock, { blockType: "text" }> => block.blockType === "text");
  // Keep content columns menu-free in local state as well as in the save payload.
  const canAssignMenu = role === "quick-links" && column.columnKey === "quick-links";
  const updateColumn = (next: FooterColumn) => onChange(canAssignMenu ? next : { ...next, assignedMenuKey: null });
  const setDescription = (text: string) => updateColumn({ ...column, blocks: [{ blockKey: descriptionBlock?.blockKey ?? "description", blockType: "text", sortOrder: 0, title: null, text }] });
  const setContact = (items: Extract<FooterBlock, { blockType: "contact" }>['items']) => updateColumn({ ...column, blocks: [{ blockKey: contactBlock?.blockKey ?? "contact", blockType: "contact", sortOrder: 0, title: null, items }] });
  const heading = role === "brand" ? (locale === "ar" ? "العلامة التجارية" : "Brand") : role === "quick-links" ? labels.quickLinks : labels.contact;
  return <section className="space-y-3 rounded-lg border p-4"><div className="flex items-center gap-2"><span className="rounded bg-muted px-2 py-1 text-xs font-medium">{index + 1}</span><span className="font-medium">{heading}</span><Input className="max-w-xs" value={column.heading ?? ""} placeholder={labels.heading} onChange={(event) => updateColumn({ ...column, heading: event.target.value || null })} /><div className="ms-auto flex gap-1"><Button type="button" size="icon" variant="ghost" disabled={!index} aria-label={labels.moveUp} onClick={() => onMove(-1)}><ArrowUp aria-hidden="true" /></Button><Button type="button" size="icon" variant="ghost" disabled={index === count - 1} aria-label={labels.moveDown} onClick={() => onMove(1)}><ArrowDown aria-hidden="true" /></Button><Button type="button" size="icon" variant="ghost" aria-label={labels.remove} onClick={onRemove}><Trash2 aria-hidden="true" /></Button></div></div>{role === "brand" && <div className="space-y-3"><MediaPicker items={media} selectedId={value.logoMediaId} locale={locale} label={labels.logo} allowExternalUrl={false} onChange={(selection) => onLogoChange(selection.mediaId)} /><Field label={labels.text}><Input value={descriptionBlock?.text ?? value.locales[locale].footerText ?? ""} onChange={(event) => { setDescription(event.target.value); onBrandDescriptionChange(event.target.value); }} /></Field></div>}{canAssignMenu && <Field label={labels.assignedMenu}><Select value={column.assignedMenuKey === canonicalFooterMenuKey ? canonicalFooterMenuKey : "none"} onValueChange={(next) => updateColumn({ ...column, assignedMenuKey: !next || next === "none" ? null : canonicalFooterMenuKey })}><SelectTrigger className="w-full"><SelectValue placeholder={labels.noMenu} /></SelectTrigger><SelectContent><SelectItem value="none">{labels.noMenu}</SelectItem>{menus.map((menu) => <SelectItem key={menu.menuKey} value={menu.menuKey}>{menu.name}</SelectItem>)}</SelectContent></Select></Field>}{role === "contact" && <ContactEditor block={contactBlock ?? { blockKey: "contact", blockType: "contact", sortOrder: 0, title: null, items: [] }} labels={labels} onChange={setContact} />}</section>;
}

function contactItems(labels: Copy, existing: Extract<FooterBlock, { blockType: "contact" }>["items"] = []) {
  const byKind = new Map(existing.map((item) => [item.kind, item]));
  return (["phone", "email", "address"] as const).map((kind) => ({
    kind,
    label: byKind.get(kind)?.label ?? labels[kind],
    value: byKind.get(kind)?.value ?? "",
    ...(byKind.get(kind)?.href ? { href: byKind.get(kind)?.href } : {}),
  }));
}

function ContactEditor({ block, labels, onChange }: { block: Extract<FooterBlock, { blockType: "contact" }>; labels: Copy; onChange: (items: typeof block.items) => void }) {
  const items = contactItems(labels, block.items);
  return <div className="grid gap-4 md:grid-cols-3">{items.map((item, index) => <div key={item.kind} className="space-y-3 rounded-lg border bg-muted/20 p-3"><Field label={labels.label}><Input value={item.label} onChange={(event) => onChange(items.map((candidate, i) => i === index ? { ...candidate, label: event.target.value } : candidate))} /></Field><Field label={labels.value}><Input aria-label={`${item.label} ${labels.value}`} placeholder={item.label} value={item.value} onChange={(event) => onChange(items.map((candidate, i) => i === index ? { ...candidate, value: event.target.value } : candidate))} /></Field></div>)}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-2 text-sm font-medium"><span>{label}</span>{children}</label>; }
function Empty({ text }: { text: string }) { return <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</div>; }
