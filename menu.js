(() => {
  const $ = id => document.getElementById(id);
  const key = "sisi-dinner-menu-v1";
  const dialog = $("editor"), select = $("foodSelect"), name = $("foodName");
  const file = $("foodFile"), preview = $("preview"), msg = $("menuMsg"), save = $("saveFood");
  let entries = DEFAULTS.map(f => ({name:f.n})), photo, revision = 0;
  try {
    const data = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(data) && data.length >= DEFAULTS.length && data.every(d =>
      d && typeof d.name === "string" && d.name.trim() && (!d.photo || /^data:image\/webp;base64,/.test(d.photo)))) entries = data;
  } catch {}

  function refresh() {
    applyMenu(entries.map((entry, i) => {
      const base = DEFAULTS[i], original = base?.n === entry.name;
      return {n:entry.name, c:DEFAULTS[i % DEFAULTS.length].c, e:original ? base.e : "🍽️",
        img:entry.photo || base?.img, q:original ? base.q : [`今晚就吃${entry.name}，大王亲点的好滋味！`]};
    }));
  }
  function showPhoto(src) {
    preview.textContent = "🍽️";
    if (src) {const im = new Image(); im.src = src; im.alt = "菜品配图"; preview.replaceChildren(im);}
  }
  function loadItem() {
    revision++; save.disabled = false; file.value = ""; msg.textContent = "";
    const i = Number(select.value);
    name.value = entries[i]?.name || ""; photo = entries[i]?.photo;
    showPhoto(FOODS[i]?.img); save.textContent = i < 0 ? "添加到转盘" : "保存修改";
  }
  function options(i) {
    select.replaceChildren(new Option("＋ 新增菜品", "-1"), ...entries.map((d, n) => new Option(d.name, n)));
    select.value = String(i); loadItem();
  }
  $("openMenu").onclick = () => {options(0); dialog.showModal();};
  $("closeMenu").onclick = () => dialog.close();
  select.onchange = loadItem;
  name.oninput = () => {msg.textContent = "";};
  file.onchange = async () => {
    const selected = file.files[0]; if (!selected) return;
    const version = ++revision, url = URL.createObjectURL(selected);
    save.disabled = true; msg.textContent = "正在处理图片…";
    try {
      if (!/^image\/(png|jpeg|webp)$/.test(selected.type)) throw Error();
      const im = new Image(); im.src = url; await im.decode();
      if (version !== revision) return;
      const canvas = document.createElement("canvas"); canvas.width = canvas.height = 320;
      const side = Math.min(im.width, im.height);
      canvas.getContext("2d").drawImage(im,(im.width-side)/2,(im.height-side)/2,side,side,0,0,320,320);
      photo = canvas.toDataURL("image/webp", .8); showPhoto(photo); msg.textContent = "";
    } catch {if (version === revision) msg.textContent = "图片无法读取，请选择 JPG、PNG 或 WebP 图片。";}
    finally {URL.revokeObjectURL(url); if (version === revision) save.disabled = false;}
  };
  $("foodForm").onsubmit = e => {
    e.preventDefault(); if (save.disabled) return;
    const title = name.value.trim(), i = Number(select.value);
    if (!title) {msg.textContent = "请输入菜名。"; name.focus(); return;}
    if (entries.some((d, n) => n !== i && d.name === title)) {msg.textContent = "菜单里已经有这道菜了。"; return;}
    const next = entries.slice(), index = i < 0 ? next.length : i;
    next[index] = {name:title, photo};
    try {localStorage.setItem(key, JSON.stringify(next));}
    catch {msg.textContent = "未能保存。请检查浏览器存储权限或可用空间。"; return;}
    entries = next; refresh(); options(index); msg.textContent = `已保存「${title}」，转盘已更新。`;
  };
  refresh();
})();
