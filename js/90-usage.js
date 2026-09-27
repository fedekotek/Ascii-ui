/* ================= the Usage tab =================
   The third tab on every component, after Preview and Code: when to use it and
   when not, its anatomy, states, keyboard, accessibility and API, drawn in
   characters.

   The top of this file is data, window.AUI_DOCS: one entry per component,
   keyed by its section id. It holds what a person has to write. What the kit
   can say about itself (the events it fires, the keys it handles, the
   settings it reads, the roles in its markup, the states its css draws) is
   read at runtime from the copy of the kit the Code tab prints (KIT() in
   js/40) and fills whatever an entry leaves out, marked "from the kit".
   qa/usage.py checks that the words and the kit agree; qa/reference.py
   prints the same model into docs/COMPONENTS-REFERENCE.md, llms.txt and
   llms-full.txt. One source, three readers, no copy to go stale.

   Fields, all optional (a component without an entry still gets the kit's facts):
     use     when to use it. One sentence each
     avoid   when not to. Each one names what to use instead: {s-id} links it
     anatomy draw  the component in characters, one string per row
             paint a string of color codes under each row (PAINT, below).
                   A space is ink; a digit or ^ in an unpainted cell is a callout
             parts [selector, name, text], numbered 1, 2, 3 in the drawing.
                   The selector must match the Code tab html (qa/usage.py)
     states  [name, swatch, paint, text]. The swatch is eight characters
     keys    [[key, ...], text]. KeyboardEvent.key names; Shift+Tab is a chord
     a11y    [tag, text]. Tags: role, name, state, focus, live, paint, touch
     dos     [do, don't]: pairs, how to use it well and the mistake next to it
     api     [kind, name, text]. Kinds: class, attr, event, call, css
     see     section ids of related components
     limits  what it does not do, and where this site's demo does more
   In text: `code`, and {s-id} for a link to another component.
   PAINT: i ink, m muted, h hot, p pink, v violet, d deep, o ok, w warn,
   c focus (focus only), n callout, b halftone (each character its own hue).
   Capitals are slabs: I ink, A ink with the edge, H hot with the edge, W warn,
   O ok, C focus, M muted. */
window.AUI_DOCS={

's-button':{
  use:['One action a person takes on purpose: save, send, publish, open a dialog.',
       'Primary, the @ rim, for the one thing the screen is for. One per screen. Two is a tie.',
       'Danger, the / rim, for the action you cannot take back.'],
  avoid:['Going to another page. That is a link, `<a href>`, and the kit already styles it.',
         'Picking one of a few options. That is a {s-togglegroup}.',
         'Turning a setting on and off. That is the switch in {s-toggles}.'],
  anatomy:{
    draw:['1 @@@@@@@@@@@@@@@@@@',
          '  @@ PUBLISH SITE @@',
          '1 @@@@@@@@@@@@@@@@@@',
          '  ^^ ^^^^^^^^^^^^',
          '  2  3'],
    paint:['  hhhhhhhhhhhhhhhhhh',
           '  hhHHHHHHHHHHHHHHhh',
           '  hhhhhhhhhhhhhhhhhh'],
    parts:[['.frame','frame','Top and bottom. The tone class names the character: `tone-heavy` @, `tone-light` =, `tone-danger` /.'],
           ['.mid','sides','The same character, two to a side.'],
           ['.label','label','The words, one line. A magenta slab on the primary. Uppercase is CSS: write them in sentence case.']]},
  states:[['rest','========','i','The rim by tone: = here, @ on the primary, / on danger.'],
          ['hover','########','i','One step denser, # here and % on the primary. Danger fills its label yellow. Mouse only.'],
          ['focus','@@@@@@@@','c','Heavy rim in the focus color, from the keyboard. The primary\'s slab takes the focus color too.'],
          ['pressed',' PREVIEW','I','An ink slab while it is held down.'],
          ['disabled','- - - - ','m','Faint rim, gray label, out of the Tab order.'],
          ['no script','========','i','Still a button. The `data-aui-*` attributes need the script.']],
  keys:[[['Tab'],'Moves the focus to it. Shift Tab goes back.'],
        [['Enter',' '],'Presses it.']],
  a11y:[['role','A native `<button>`. Nothing to add.'],
        ['name','Its label. A button with only a glyph needs an `aria-label`.'],
        ['state','`disabled` takes it out of the Tab order and says so. The kit styles `:disabled`, not `aria-disabled`.'],
        ['paint','The rim is CSS content with empty alt text. Screen readers skip it.'],
        ['touch','Three rows tall, 63px. A thumb finds it.']],
  dos:[['Say what it does, as a verb and a thing: "Publish site".','Write "OK" or "Submit" and make people read the page to find out what they agreed to.'],
       ['One primary per screen, for the thing the screen is for.','Make every button primary, so none of them is.'],
       ['Put Danger on the one action that cannot be undone.','Paint Cancel yellow because it sounds negative.']],
  api:[['class','.btn','On the `<button>`. Uppercase, one line, no border of its own.'],
       ['class','.frame .tone-*','The rim. `tone-heavy`, `tone-light`, `tone-danger`, or any other tone.'],
       ['class','.btn-primary','Magenta rim, magenta slab under the label. With `tone-heavy`.'],
       ['class','.btn-danger','Yellow rim and label. With `tone-danger`.'],
       ['attr','type="button"','So it does not send the form it sits in. Only the one that sends leaves it out.'],
       ['attr','disabled','Gray and faint, out of the Tab order.'],
       ['attr','data-aui-toast data-aui-toast-err','A lime toast on click, or a yellow one. The words are the value. See {s-toast}.'],
       ['attr','data-aui-open data-aui-close','Opens the dialog after it, or closes the one it sits in. See {s-card}.'],
       ['attr','data-aui-reset','Puts the fields of its form or dialog back. See {s-sheet}.'],
       ['attr','data-aui-fill','Runs the nearest progress bar, for demos. See {s-progress}.'],
       ['event','click','The native one. The kit adds none.'],
       ['css','--frame-color','The rim color. The primary sets it to `--hot`, danger to `--danger`.']],
  see:['s-toast','s-card','s-dropdown','s-togglegroup'],
  limits:['No icon slot and no loading state. `data-aui-fill` shows how a wait looks: a spinner in the label.',
          'On this site the label scrambles when it arrives and the rim draws itself. The kit button holds still.']
},

's-input':{
  use:['One line a person types: a name, a link, an email address.',
       'A value with rules. `data-aui="validate"` checks them when you leave the field and says what is wrong, under it. From then on it checks as you type.'],
  avoid:['More than one line. That is a {s-textarea}.',
         'Picking from a list you already know. That is a {s-select}.',
         'A one-time code. That is {s-otp}: six boxes, paste included.'],
  anatomy:{
    draw:['1 Link',
          '2 !!!!!!!!!!!!!!!!!!!!!!!!!!',
          '  !! > Reporting redesign !!',
          '2 !!!!!!!!!!!!!!!!!!!!!!!!!!',
          '     ^ ^^^^^^^^^^^^^^^^^^',
          '     3 4',
          '5 Use lowercase letters,',
          '  numbers and hyphens.'],
    paint:['',
           '  wwwwwwwwwwwwwwwwwwwwwwwwww',
           '  ww w iiiiiiiiiiiiiiiiii ww',
           '  wwwwwwwwwwwwwwwwwwwwwwwwww',
           '','',
           '  wwwwwwwwwwwwwwwwwwwwww',
           '  wwwwwwwwwwwwwwwwwwww'],
    parts:[['.field-label','label','A real `<label>`. The kit points its `for` at the input.'],
           ['.field','frame','With `.frame .tone-light`. = at rest, @ in the focus color, ! when wrong, as here. A tap anywhere on it focuses the input.'],
           ['.prompt','prompt','Paint, `aria-hidden`. > for text; {s-select} uses v.'],
           ['input','input','The real one. Its own rules say what is wrong: `required`, `pattern`, `type`, the lengths, the range.'],
           ['.error','error','Empty until something is wrong, and hidden while empty. The kit writes the words.']]},
  states:[['rest','========','i','= rim, :: sides.'],
          ['focus','@@@@@@@@','c','Heavy rim in the focus color.'],
          ['invalid','!!!!!!!!','w','A wall of ! in yellow and the message under it. `.invalid` on the frame, `aria-invalid` on the input.'],
          ['invalid, focused','!!!!!!!!','c','The wall of ! in the focus color: where you are, and that it is wrong. The message stays.'],
          ['disabled','- - - - ','m','A faint rim and gray text, the way a disabled button looks. Out of the Tab order.'],
          ['no script','========','i','A plain field. The browser checks it on send, with its own bubble.']],
  keys:[[['Tab'],'Moves the focus in. Leaving checks the value.'],
        [['Enter'],'Sends its form, the browser way. A wrong field stops the send and gets the focus.']],
  a11y:[['name','The `<label>`. The kit links it with `for` when the label is not wrapped around the input.'],
        ['state','`aria-invalid` is `true` or `false`. The kit sets it as the verdict changes.'],
        ['live','The message is linked by `aria-describedby`. It is not announced: it is read with the field, and a failed send moves the focus there. Nothing is said while a person types the first time; the check waits for them to leave.'],
        ['paint','The frame is paint. The prompt is `aria-hidden`.'],
        ['touch','The whole frame takes the tap, all three rows. Give it the right `type` and `autocomplete`: the phone picks its keyboard from them.']],
  dos:[['Keep the label above the field, where it stays while you type.','Use the placeholder as the label. It is gone after the first key.'],
       ['Say what is wrong and how to fix it: "Use lowercase letters, numbers and hyphens."','Say "Invalid input" and leave the rest as an exercise.'],
       ['Size the field to the answer: a postcode is short.','Stretch every field to the full width of the page.']],
  api:[['class','.field .frame .tone-light','The frame, around a `.mid` that holds the prompt and the input.'],
       ['class','.field-label .error','The label above it and the message under it.'],
       ['class','.group','Around label, field and message. 48 characters wide at most, a row between two.'],
       ['attr','data-aui="validate"','On the `<input>`. Checks when you leave it and when the form is sent, then as you type, so a fix clears the message at once. A value wrong on load shows its message from the start. Writes to the nearest `.error`, or to what `aria-describedby` names.'],
       ['attr','required pattern type','The rules, native. `minlength`, `maxlength`, `min` and `max` too.'],
       ['attr','data-error-required','The words for a rule: also `data-error-type`, `data-error-pattern`, `data-error-length`, `data-error-range`, and `data-error` for the rest. A plain default when missing.'],
       ['event','aui:invalid aui:valid','On the input, when a person changes the verdict. `detail`: `{ message, validity }`.'],
       ['call','ASCIIUI.validate(form)','Checks every field in it, writes the messages, returns `true` or `false`. It moves no focus and fires no events.'],
       ['call','ASCIIUI.get(input)','`check()`, `clear()`, `message`.'],
       ['css','--frame-color','The rim color. Focus sets `--accent`, `.invalid` sets `--danger`.']],
  see:['s-select','s-textarea','s-otp','s-toggles'],
  limits:['On this site the rim ripples as you type and a wrong value buzzes. The kit is quiet.',
          'The message is in English unless the `data-error` words say otherwise.']
},

's-tabs':{
  use:['Two to six views of one thing, one at a time: a preview and its code, settings by topic.',
       'Panels that are already on the page. The arrows open each one on the way past.'],
  avoid:['Moving between pages. Tabs swap panels, links go places. For the trail back, {s-breadcrumb}.',
         'A value for a form. That is a {s-togglegroup}: it is sent with the form.',
         'More tabs than fit on one line. The strip wraps and stops reading as one row.'],
  anatomy:{
    draw:['    2         3',
          '    v         v',
          '    BUTTON    HTML    CSS  ',
          '1 =========================',
          '4 Only the picked panel shows.'],
    paint:['',
           '    n         n',
           '  AAAAAAAAAA  mmmm    mmm  ',
           '  vvvvvvvvvvvvvvvvvvvvvvvvv',
           '  mmmmmmmmmmmmmmmmmmmmmmmmmmmm'],
    parts:[['.tablist','strip','`role="tablist"`, where `data-aui="tabs"` goes. Its rule is violet.'],
           ['.tab[aria-selected="true"]','picked','An ink slab. The only tab in the Tab order.'],
           ['.tab','tab','A real `<button>`, a muted word until it is picked.'],
           ['.tabpanel','panel','`role="tabpanel"`, one per tab, after the strip and in the same order. The others are `hidden`.']]},
  states:[['rest','  HTML  ','m','A muted word.'],
          ['hover','  HTML  ','i','Ink. Mouse only.'],
          ['focus','  HTML  ','C','A slab in the focus color.'],
          ['picked',' BUTTON ','I','An ink slab.'],
          ['no script','  HTML  ','m','The panels show or hide as the HTML has them. The tabs do nothing.']],
  keys:[[['Tab'],'Lands on the picked tab. Tab again goes to its panel.'],
        [['ArrowLeft','ArrowRight'],'The previous or the next tab, and its panel. It wraps around.'],
        [['Home','End'],'The first or the last tab.']],
  a11y:[['role','`tablist`, `tab` and `tabpanel`, in the markup. The kit links each tab to its panel with `aria-controls` and `aria-labelledby`, and makes the ids.'],
        ['name','Give the tablist an `aria-label` that says what the views are of.'],
        ['state','`aria-selected` on the picked tab. Only that one has `tabindex="0"`, so the strip is one Tab stop.'],
        ['focus','A panel with `tabindex="0"` is a Tab stop of its own, marked by a bar in the focus color on its left.'],
        ['paint','The rule under the strip is paint.']],
  dos:[['Name tabs with a noun or two: HTML, CSS.','Put a sentence on a tab. The strip wraps and stops being a row.'],
       ['Start on the tab most people need.','Start on Settings because it was built last.']],
  api:[['attr','data-aui="tabs"','On the `role="tablist"`. Click, the arrows, Home and End pick a tab.'],
       ['attr','aria-selected="true"','On the tab that starts picked. The first one, when none says so.'],
       ['attr','aria-controls','Optional. Names a panel by id, for panels that do not sit next to the strip.'],
       ['class','.tablist .tab .tabpanel','The strip, each tab, each panel.'],
       ['event','aui:change','On the tablist, when a person picks another tab. `detail`: `{ tab, index }`. Not on load, not for `select()`.'],
       ['call','ASCIIUI.tabs(el)','`select(i)` takes an index or a tab. `index` and `tab` say which one is picked.']],
  see:['s-togglegroup','s-breadcrumb','s-pagination'],
  limits:['The panels sit next to the strip, in one element around both, unless `aria-controls` names them. Two tab sets need two wrappers.',
          'Up and Down do nothing. The strip is a row.',
          'A panel shows as soon as the arrow reaches its tab. For a panel that has to load, that is a request per key press.']
},

's-dropdown':{
  use:['A handful of actions on one thing that do not need to be on screen all the time: duplicate, copy a link, archive.',
       'Labels up to 18 characters, key hint included. The menu is 28 wide.'],
  avoid:['A value for a form. That is a {s-select}: it is sent with the form and a phone shows its own picker.',
         'One or two actions. Show them as {s-button}s. A menu hides them for nothing.',
         'The navigation of a site. `role="menu"` tells a screen reader to expect an app. Use a list of links.'],
  anatomy:{
    draw:['  ===============',
          '1 :: ACTIONS V ::',
          '  ===============',
          '2 @@@@@@@@@@@@@@@@@@@@@@@@@@',
          '  @@  Duplicate      [d]  @@::',
          '3 @@  Copy link      [l]  @@::',
          '4 @@  - - - - - - - - -   @@::',
          '5 @@  Delete forever      @@::',
          '  @@@@@@@@@@@@@@@@@@@@@@@@@@::',
          '    ::::::::::::::::::::::::::'],
    paint:['','','','',
           '                            dd',
           '      IIIIIIIIIIIIIIIIII    dd',
           '      mmmmmmmmmmmmmmmmmm    dd',
           '      wwwwwwwwwwwwww        dd',
           '                            dd',
           '    dddddddddddddddddddddddddd'],
    parts:[['[aria-haspopup]','trigger','A {s-button} with `aria-haspopup="menu"`. The kit keeps its `aria-expanded` true or false.'],
           ['.menu','menu','`role="menu"` around a card in `tone-heavy`. `hidden` until it opens, 28 characters wide, under the trigger.'],
           ['[role="menuitem"]','item','A real button with `tabindex="-1"`. The one with the focus is an ink slab. A `<kbd>` at the end is a label, nothing more.'],
           ['.sepd','rule','A {s-separator} with `role="separator"`, between groups of items.'],
           ['.danger','danger','Yellow words and a yellow slab under the focus. For the one you cannot take back.']]},
  states:[['closed','========','i','The menu is `hidden` and the trigger says `aria-expanded="false"`.'],
          ['open','@@@@@@@@','i','The card, under the trigger and over whatever is below it.'],
          ['item focus, hover','  Copy  ','I','An ink slab, from the keyboard or a mouse. In a menu they are the same thing.'],
          ['disabled','  Undo  ','m','`disabled` on an item: gray, and the arrows skip it.'],
          ['danger focus',' Delete ','W','A yellow slab.'],
          ['no script','========','i','The trigger does nothing and the menu stays closed.']],
  keys:[[['Enter',' '],'On the trigger: opens the menu, the focus on the first item. On an item: picks it and closes.'],
        [['ArrowDown','ArrowUp'],'On the trigger: opens, the focus on the first or the last item. In the menu: the next or the previous one. It wraps.'],
        [['Home','End'],'The first or the last item.'],
        [['Escape'],'Closes. The focus goes back to the trigger.'],
        [['Tab'],'Closes, and the focus moves on.']],
  a11y:[['role','`aria-haspopup="menu"` on the trigger, `role="menu"` on the list, `role="menuitem"` on each item. The kit adds `aria-controls` and keeps `aria-expanded`.'],
        ['name','Give the menu an `aria-label`. An item is named by all of its text: `Duplicate <kbd>d</kbd>` is read "Duplicate d". Put `aria-hidden` on the `<kbd>`: in the kit it is a label, not a key.'],
        ['focus','Opening moves the focus into the menu, closing puts it back on the trigger. Items stay out of the Tab order.'],
        ['touch','A tap anywhere outside closes it. Items are 45px tall.'],
        ['paint','The rims, walls and shadow are paint. The v after the label is `aria-hidden`.']],
  dos:[['Put the item you cannot take back last, after a rule, in yellow.','Put Delete next to Duplicate, where a slip of the thumb picks it.'],
       ['Name items with verbs: Duplicate, Copy link, Archive.','Mix actions and settings in one menu.']],
  api:[['attr','data-aui="dropdown"','On the `.pop`. The `[aria-haspopup]` button inside opens the `role="menu"` inside.'],
       ['class','.pop .menu','The box around both, and the menu. `.danger` on an item makes it yellow.'],
       ['attr','disabled','On an item: gray, and the arrows skip it.'],
       ['attr','data-aui-toast data-aui-toast-err','On an item: a lime or a yellow toast when it is picked.'],
       ['event','aui:select','On the `.pop`, when an item is picked. `detail`: `{ item, text }`. `text` is all of it, key hint included: "Duplicate d".'],
       ['call','ASCIIUI.dropdown(el)','`open()`, `close()`, `toggle()`, `isOpen`. `open()` leaves the focus where it is.']],
  see:['s-button','s-select','s-tooltip','s-kbd','s-separator'],
  limits:['The letters next to the items are labels. On this site they pick the item; in the kit they do nothing.',
          'No typing to jump to an item, no submenus, no items that check on and off.',
          'It always opens under the trigger, from its left edge. Near the bottom or the right of the screen it does not flip.']
},

's-card':{
  use:['Card: one thing and its facts, under a title that says what it is. A project, a person, a plan.',
       'Dialog: a decision the page has to stop for. Publish, delete, leave without saving. The safe button first, the action last.'],
  avoid:['Saying that something happened. That is a {s-toast}, and it stops nobody.',
         'A warning that stays on the page. That is an {s-alert}: the same card with a hazard rim.',
         'Filters or options on a phone. That is a {s-sheet}: it comes up from the bottom.',
         'Asking before something that can be undone. Do it, say so, and skip the question.'],
  anatomy:{
    draw:['1 @@ REPORTING REDESIGN @@@@@@',
          '  ##                        ##::',
          '3 ##  Team     Analytics    ##::',
          '  ##  Owner    Ana Ruiz     ##::',
          '  ##                        ##::',
          '2 ############################::',
          '4   ::::::::::::::::::::::::::::',
          '5 . . . . . . . . . . . . . . .',
          '  . @@ PUBLISH PROJECT? @@@@@ .',
          '  . . . . . . . . . . . . . . .'],
    paint:['    HHHHHHHHHHHHHHHHHHHH',
           '                              dd',
           '      mmmmmmmmmiiiiiiiii      dd',
           '      mmmmmmmmmiiiiiiii       dd',
           '                              dd',
           '                              dd',
           '    dddddddddddddddddddddddddddd',
           '  hhhhhhhhhhhhhhhhhhhhhhhhhhhhh',
           '  h iiHHHHHHHHHHHHHHHHHHiiiii h',
           '  hhhhhhhhhhhhhhhhhhhhhhhhhhhhh'],
    parts:[['.bar-title','title','A magenta slab on the top rim. One line, cut with an ellipsis when it runs long. The tag is yours: `h2`, `h3`, `span`.'],
           ['.card','frame','With `.frame` and a tone. The top rim is always @; the walls and the bottom come from the tone.'],
           ['.body','body','The walls, and four characters of air on each side. A `.row` inside gets a row above it.'],
           ['.lift','shadow','The wrapper. Colons in `--deep`, a row down and two characters right. 50 characters wide at most.'],
           ['dialog','dialog','A native `<dialog>` around the same card, in `tone-heavy`. It opens modal, over a veil of magenta periods, one every other character on every row.']]},
  states:[['card','########','i','A card has no states of its own. The buttons in it do.'],
          ['closed','        ','m','The dialog is not drawn.'],
          ['open','. . . . ','h','Modal. The page behind is inert, under a veil of magenta periods, and does not scroll.'],
          ['no script','########','i','The card is plain HTML. Its button opens nothing.']],
  keys:[[['Enter',' '],'On the button: opens the dialog. The focus moves to its first button.'],
        [['Tab','Shift+Tab'],'Moves between the buttons of the dialog. The page behind is out of reach.'],
        [['Escape'],'Closes it. The focus goes back to the button that opened it.']],
  a11y:[['role','A native `<dialog>`, opened with `showModal()`: modal, the page behind is inert. The card is an `<article>`; the heading in it is what a screen reader lands on.'],
        ['name','The kit names the dialog by its `.bar-title` (`aria-labelledby`) and describes it by the first paragraph of its `.body` (`aria-describedby`).'],
        ['focus','On open, the first button takes the focus, so the safe one goes first. `autofocus` picks another. On close, the focus goes back to the opener.'],
        ['live','A toast shown while the dialog is open goes inside it, so it sits on top and is read out.'],
        ['paint','The rims, the walls and the shadow are paint.']],
  dos:[['Name the action button for what it does: "Publish".','Ask "Are you sure?" and offer Yes and No.'],
       ['Give a card a title that says what it is.','Put a card inside a card. The walls double and the shadow falls on nothing.']],
  api:[['class','.lift','The wrapper that casts the shadow.'],
       ['class','.card .frame .tone-*','The box. `tone-mid` for a card, `tone-heavy` for a dialog, `tone-faint` for {s-empty}.'],
       ['class','.bar-title .body','The title on the rim, and the walls with the content.'],
       ['attr','data-aui-open','On a button. Opens the `<dialog>` after it, in the same element. `data-aui-open="id"` opens that one.'],
       ['attr','data-aui-dialog="name"','Names a dialog without an id, for `data-aui-open="name"`.'],
       ['attr','data-aui-close','On a button in the dialog: closes it. With `data-aui-toast` it closes and says so.'],
       ['event','close','The dialog\'s own, however it closes. The kit adds none.'],
       ['call','button.click()','Opens it from a script with all the kit adds. `dialog.showModal()` alone skips the tap outside that closes it.'],
       ['css','--dcols','The width of the dialog, in characters. 36 when missing.']],
  see:['s-sheet','s-alert','s-empty','s-toast','s-button'],
  limits:['On this site Publish flips the card to live and the button to Unpublish. That is the site script. The kit opens the dialog every time.']
},

's-slider':{
  use:['An amount where about right is right: volume, zoom, the glitch on this page.',
       'A value whose effect shows while you drag.'],
  avoid:['An exact number. Type it: an {s-input} with `type="number"`.',
         'A few named choices, like low, medium and high. That is a {s-togglegroup}.',
         'Showing how far along something is. That is {s-progress}: the same bar, and nobody drags it.'],
  anatomy:{
    draw:['1 Glitch amount',
          '  @@@@@@@%#*+=:...........  55',
          '  ^^^^^^^^^^^^^^^^^^^^^^^^  ^^',
          '  2+3                       4'],
    paint:['',
           '  bbbbbbbbbbbbbbbbbbbbbbbb  ii',
           '',
           '  nnn'],
    parts:[['.slider label','label','A real `<label>`. The kit points its `for` at the range.'],
           ['.bar','bar','Paint, `aria-hidden`. 24 cells, `data-cells` sets how many. Magenta where it is full, dots where it is not.'],
           ['input[type="range"]','range','The real control, invisible, on top of the bar and 12px taller on each side, so a thumb finds it.'],
           ['output','output','The number. The kit fills it and points its `for` at the range.']]},
  states:[['rest','@%#*+=:.','b','The bar, full to the value. Magenta, pink, yellow, then dots.'],
          ['focus','@%#*+=:.','c','The whole bar turns to the focus color.'],
          ['disabled','@%#*+=:.','b','No look of its own in the kit. The range stops moving; the bar does not say so.'],
          ['no script','        ','m','The range still works, but it is invisible over an empty bar. Draw a bar into the HTML if the page has to work without the script.']],
  keys:[[['ArrowLeft','ArrowDown'],'One step down. The step is the `step` attribute.'],
        [['ArrowRight','ArrowUp'],'One step up.'],
        [['PageDown','PageUp'],'A bigger step. Chrome takes a tenth of the range.'],
        [['Home','End'],'The lowest, the highest.']],
  a11y:[['role','A native range: role `slider`, with its value and bounds from `min`, `max` and `value`. Every key above is the browser\'s own.'],
        ['name','The `<label>`. The kit links it with `for`.'],
        ['state','A bare number is read as a bare number. When it has a unit, set `aria-valuetext` from your `input` listener: "70 kg" beats "70".'],
        ['live','Chrome exposes the `<output>` as a polite live region, on top of the range\'s own value. If the number is read twice, give the output `aria-hidden="true"`.'],
        ['paint','The bar is `aria-hidden` paint.'],
        ['touch','The range covers the bar and 12px above and below it: 45px to aim at. `inputmode="none"` keeps some Android phones from opening a keyboard for it.']],
  dos:[['Show the number next to the bar, with its unit.','Make people drag to find out where they are.'],
       ['Apply the value while it moves, when that is cheap.','Send a request on every step of a drag.']],
  api:[['attr','data-aui="slider"','On the `.slider`. Draws the bar from the range and fills the `<output>`.'],
       ['attr','data-cells="24"','How many cells the bar has. 24 when missing. Followed live.'],
       ['attr','min max step value','On the range, native. `max` is 100 when missing.'],
       ['class','.slider .slider-track .bar','The box, the track that holds the bar and the range, and the bar.'],
       ['event','input change','The range\'s own. `input` while it moves, `change` when it is let go.'],
       ['call','ASCIIUI.get(el).draw()','Redraws the bar after a script sets `value`. Setting `value` fires no event, so nothing redraws by itself.']],
  see:['s-progress','s-input','s-togglegroup'],
  limits:['One thumb. For a range with two ends, use two sliders.',
          'On this site the bar jitters while you drag and the slider sets the glitch of the whole page. The kit draws a clean bar and leaves the meaning to you.']
},

/* ---------------- Form ---------------- */

's-calendar':{
  use:['One day, picked from a month you can see: a delivery date, a booking, a deadline.',
       'Days with limits. `data-min` and `data-max` gray out the rest and the arrows stop at the edge.'],
  avoid:['A date a person already knows, like a birthday. Typing is faster: an {s-input} with `type="date"`.',
         'A range, from and to. It picks one day.',
         'A time of day. It has no hours.'],
  anatomy:{
    draw:['1 [<]    SEPTEMBER 2026    [>]',
          '2  M   T   W   T   F   S   S  ',
          '3  21  22  23  24  25  26  27 ',
          '               ^^      ^^^^',
          '               4       5',
          '6 Saturday, 26 September 2026.'],
    paint:['  mim    iiiiiiiiiiiiii    mim',
           '  mmmmmmmmmmmmmmmmmmmmmmmmmmmm',
           '  iiiiiiiiiiiihhhhiiiiAAAAiiii',
           '','',
           '  mmmmmmmmmmmmmmmmmmmmmmmmmmmm'],
    parts:[['.cal-head','head','The month and the year, with [<] and [>] for the month before and after. They turn `disabled` past `data-min` or `data-max`.'],
           ['.cal-grid span','weekdays','One letter a day, in the language of the page. `aria-hidden`: every day says its own weekday.'],
           ['.cal-grid button','day','A real button, 4 characters wide. Its `aria-label` is the whole date.'],
           ['.today','today','Magenta and bold. The kit reads the date once, when it wires the calendar.'],
           ['[aria-pressed="true"]','picked','An ink slab, and `aria-pressed="true"`.'],
           ['[role="status"]','status','The nearest one says the pick in full, or "No date picked."']]},
  states:[['day','  21    ','i','A number in ink.'],
          ['today','  24    ','h','Magenta and bold.'],
          ['picked','  26    ','  IIII  ','An ink slab.'],
          ['focus','  25    ','  CCCC  ','A slab in the focus color. Only this day is in the Tab order.'],
          ['disabled','  19    ','m','Outside `data-min` or `data-max`: gray, thin and `disabled`.'],
          ['no script','        ','m','Nothing is drawn. Put an `<input type="date">` inside as a fallback: the script replaces it.']],
  keys:[[['Tab'],'Through [<] and [>], then onto the focused day. The month is one Tab stop.'],
        [['ArrowLeft','ArrowRight'],'The day before or after, into the next month when it has to.'],
        [['ArrowUp','ArrowDown'],'The same weekday, a week before or after.'],
        [['Home','End'],'The first or the last day of the week.'],
        [['PageUp','PageDown'],'The same day a month before or after, or the last day of a shorter month.'],
        [['Enter',' '],'Picks the focused day.']],
  a11y:[['role','Buttons in a grid of boxes. It is not a `role="grid"`: a screen reader hears a run of buttons, each with its full date.'],
        ['name','Each day is named "Saturday, 26 September", in the language of the page. [<] and [>] are "Previous month" and "Next month".'],
        ['state','`aria-pressed="true"` on the pick. Days outside the limits are `disabled`.'],
        ['live','The status line is `role="status"`: it reads the pick when it changes. A new month is said too, "October 2026.", from a hidden live region inside the calendar that stays put while the month is redrawn.'],
        ['touch','A day is 4 characters wide and 45px tall.']],
  dos:[['Set `data-min` and `data-max` when only some days make sense.','Let people pick a delivery date in the past and say no afterwards.'],
       ['Say the pick in words, in the status line.','Leave the slab to say it alone.']],
  api:[['attr','data-aui="calendar"','On an empty element. The kit draws the month into it.'],
       ['attr','data-value="2026-09-26"','The day picked on load, as `yyyy-mm-dd`. Without it nothing is picked and today has the focus.'],
       ['attr','data-min data-max','The first and the last day that can be picked, as `yyyy-mm-dd`.'],
       ['attr','data-week-start="0"','Sunday first. Monday, 1, when missing.'],
       ['attr','data-locale="de"','The language of the month and day names. The page\'s `lang` when missing.'],
       ['attr','data-name="when"','Adds a hidden input with that name and the ISO date, for the form. Empty until a person picks.'],
       ['class','.cal .cal-head .cal-grid .today','The box, the head, the grid, and today.'],
       ['event','aui:change','On the calendar, when a person picks a day. `detail`: `{ date, value }`. `value` is `yyyy-mm-dd`.'],
       ['call','ASCIIUI.calendar(el)','`set(date)` takes a `Date` or `"2026-09-26"`, `null` clears it. `date` and `value` say the pick.']],
  see:['s-input','s-pagination','s-togglegroup'],
  limits:['One day. No ranges, no times.',
          'No typing a date into it. The arrows and the month buttons are the way around.',
          'A reset of its form, or of the dialog it sits in, puts back `data-value`, or nothing picked.']
},

's-otp':{
  use:['A one-time code sent by text or email: six digits, typed or pasted.',
       'Sign-in and confirm steps. The first box has `autocomplete="one-time-code"`, so a phone offers the code from the message.'],
  avoid:['A password or anything a person chose. That is an {s-input} with `type="password"`.',
         'Codes with letters in them. The kit drops everything that is not a digit. Use an {s-input}.',
         'A number that is not a code, like a phone number. That is an {s-input} with `type="tel"`.'],
  anatomy:{
    draw:['1 [4] [2] [0] [_] [_] [_]',
          '   ^           ^',
          '   2           3',
          '4 3 of 6.'],
    paint:['  mim mim mim cmc mmm mmm',
           '','',
           '  mmmmmmm'],
    parts:[['.otp','group','`role="group"` with an `aria-label`, where `data-aui="otp"` goes. One box per digit, in order.'],
           ['.otp span','box','A real `<input maxlength="1">` in a `<span>`. The brackets are the span\'s paint. They turn to the focus color around the box you are in.'],
           ['input[placeholder]','empty','The placeholder, `_`, in muted.'],
           ['[role="status"]','status','The nearest one says how many digits are in, then "Code 420123 accepted.", and "Digits only." when a letter comes in.']]},
  states:[['empty','[_] [_] ','mmm mmm ','Brackets and underscores in muted.'],
          ['focus','[_]     ','cmc     ','The brackets of the box you are in, in the focus color.'],
          ['accepted','[4] [2] ','ooo ooo ','Every box holds a digit: `.good` on the group, lime brackets and digits.'],
          ['invalid','!_! !_! ','wmw wmw ','A letter typed or pasted: `.invalid` on the group, `aria-invalid` on the box, brackets turned into ! in yellow, and "Digits only." The next digit, or Backspace, puts it right.'],
          ['no script','[_] [_] ','mmm mmm ','Six plain boxes. No advance, no paste across them, no hidden input.']],
  keys:[[['Tab','Shift+Tab'],'Box to box, like any fields. A digit typed moves on by itself.'],
        [['Backspace'],'In an empty box: clears the one before and goes there.'],
        [['ArrowLeft','ArrowRight'],'The box before or after.']],
  a11y:[['role','`role="group"` with an `aria-label` holds the boxes. Each box has its own label, "Digit 1" to "Digit 6".'],
        ['focus','A box selects its digit when it gets the focus, so a new digit replaces it.'],
        ['live','The status line is `role="status"`. It says "3 of 6." as you type and the code once it is in.'],
        ['touch','`inputmode="numeric"` opens the number pad. The kit adds it when it is missing. Each box takes the tap 12px above and below.'],
        ['paint','The brackets are CSS content with empty alt text.']],
  dos:[['Say where the code was sent, above the boxes.','Leave a person to guess which inbox to open.'],
       ['Let a paste fill every box. The kit does it already.','Block paste to feel secure. It only makes it slower.']],
  api:[['attr','data-aui="otp"','On the `.otp`. Moves on after a digit, goes back on Backspace, spreads a paste over the boxes.'],
       ['attr','data-name="code"','Adds a hidden input with that name and the whole code, for the form.'],
       ['attr','autocomplete="one-time-code"','On the first box. The kit sets it when it is missing or `off`.'],
       ['attr','data-error="Digits only."','On the `.otp`: what the status line says when a character is not a digit.'],
       ['class','.otp .good .invalid','The group, `.good` once every box holds a digit, `.invalid` after a letter. Add `.invalid` yourself for a code the server refused: the next digit takes it away.'],
       ['event','aui:complete','On the `.otp`, when a person fills the last box. `detail`: `{ value }`. Not on load, not for `value =`.'],
       ['call','ASCIIUI.otp(el)','`value` reads the code or sets it, `clear()` empties every box.']],
  see:['s-input','s-button'],
  limits:['Digits only. A letter is refused and said; in a paste, only the digits are kept.',
          'The length is the number of boxes. Four boxes, four digits.',
          'No resend timer. Say a refused code in the status line, with `.invalid` on the group.',
          'On this site an accepted code plays a sound. The kit is quiet.']
},

's-select':{
  use:['One value from a list a person already knows, five to fifteen of them: a region, a country, a size.',
       'A value for a form. It is sent with it, and a phone shows its own picker.'],
  avoid:['Two to five options that fit on screen. That is a {s-togglegroup}: every choice in view, one tap.',
         'Actions. That is a {s-dropdown}.',
         'A long list people search, like every city. The native list has no filter. Use an {s-input} with a `<datalist>`.'],
  anatomy:{
    draw:['1 Probe region',
          '2 ============================',
          '  :: v iad-1, Washington    ::',
          '2 ============================',
          '     ^ ^^^^^^^^^^^^^^^^^',
          '     3 4'],
    paint:['',
           '',
           '     h iiiiiiiiiiiiiiiii'],
    parts:[['.field-label','label','A real `<label>`. The kit points its `for` at the select.'],
           ['.field','frame','The frame of the {s-input}: = at rest, @ in the focus color while the select has the focus.'],
           ['.prompt','prompt','A v, `aria-hidden`. It says a list opens here.'],
           ['select','select','The native one. The list is the browser\'s own, and so is the picker on a phone.']]},
  states:[['rest','========','i','= rim, :: sides.'],
          ['focus','@@@@@@@@','c','Heavy rim in the focus color.'],
          ['invalid','!!!!!!!!','w','A wall of ! when the frame has `.invalid`. Nothing sets it for a select: add it yourself.'],
          ['disabled','- - - - ','m','A faint rim and gray text. The select stops taking the focus.'],
          ['no script','========','i','Works as it is. It is native.']],
  keys:[[['Tab'],'Moves the focus to it.'],
        [[' '],'Opens the list. From there the keys are the browser\'s.'],
        [['ArrowDown','ArrowUp'],'The next or the previous option. A letter jumps to the first option that starts with it.']],
  a11y:[['role','A native `<select>`. A screen reader says its name, its value and how many options there are.'],
        ['name','The `<label>`. The kit links it with `for`.'],
        ['paint','The frame is paint. The prompt is `aria-hidden`.'],
        ['touch','The whole frame takes the tap. A tap on the rim focuses the select and opens its list, where the browser lets a script do that (`showPicker()`).']],
  dos:[['Write options the way people say them: "fra-1, Frankfurt".','List bare internal codes and make people decode them.'],
       ['Start with a first option that asks, when no default is right.','Preselect something nobody chose and send it.']],
  api:[['class','.field .frame .tone-light','The frame, around a `.mid` that holds the prompt and the select.'],
       ['class','.field-label .prompt','The label above it and the v in front.'],
       ['class','.group','Around label and field. 48 characters wide at most.'],
       ['attr','required','Native. The browser checks it when the form is sent.'],
       ['event','change','The select\'s own. The kit adds none.'],
       ['css','--frame-color','The rim color. Focus sets `--accent`.']],
  see:['s-input','s-togglegroup','s-dropdown'],
  limits:['`multiple` is not styled. The frame is one row tall.',
          'No search in the list. Past twenty options, use a {s-combobox}.']
},

's-textarea':{
  use:['More than one line: a note, a description, a message.',
       'Text with a limit. The count under it says how far along you are.'],
  avoid:['One line. That is an {s-input}: Enter sends the form.',
         'Rich text. This is plain text: no bold, no links.',
         'A code or a number. That is {s-otp} or an {s-input}.'],
  anatomy:{
    draw:['1 Crit notes',
          '2 ============================',
          '3 ::  What is this screen   ::',
          '  ::  trying to do?         ::',
          '2 ============================',
          '4                       12/280'],
    paint:['','','','','',
           '                        mmmmmm'],
    parts:[['.field-label','label','A real `<label>`. The kit points its `for` at the textarea.'],
           ['.field.area','frame','The frame with `.area`: walls of : down each side, as tall as the textarea.'],
           ['textarea','textarea','The real one, with `rows` and `maxlength`. It does not resize.'],
           ['.count','count','Written by the kit: characters typed, a slash, the `maxlength`. Yellow and bold once it is full.']]},
  states:[['rest','========','i','= rim, :: walls.'],
          ['focus','@@@@@@@@','c','Heavy rim in the focus color.'],
          ['full','280/280 ','wwwwwww ','`.full` on the count at `maxlength`. The browser stops taking characters.'],
          ['invalid','!!!!!!!!','w','A wall of ! when the frame has `.invalid`. The counter never sets it.'],
          ['disabled','- - - - ','m','A faint rim and gray text, out of the Tab order.'],
          ['no script','========','i','A plain textarea. The count stays at what the HTML says.']],
  keys:[[['Tab'],'Moves the focus in, and out again. It never types a tab.'],
        [['Enter'],'A new line. It does not send the form.']],
  a11y:[['name','The `<label>`. The kit links it with `for`.'],
        ['state','The count is plain text after the field: not linked, not announced. Point `aria-describedby` at it when people need it read with the field.'],
        ['paint','The frame is paint.'],
        ['touch','The whole frame takes the tap, walls included.']],
  dos:[['Give it as many `rows` as a good answer needs.','Ask for a paragraph through a two-row slot.'],
       ['Set `maxlength` only when the limit is real.','Count against a number nobody enforces.']],
  api:[['attr','data-aui="counter"','On the `<textarea>`. Counts against `maxlength` into the nearest `.count`.'],
       ['attr','maxlength','Native. Without it the count is a plain number.'],
       ['attr','data-status="id"','Names a count somewhere else on the page.'],
       ['class','.field .area','The frame, with walls instead of sides.'],
       ['class','.count .full','The count, and `.full` at the limit.'],
       ['event','input','The textarea\'s own. The kit adds none.'],
       ['call','ASCIIUI.get(el).draw()','Counts again after a script sets `value`. Setting `value` fires no event.']],
  see:['s-input','s-select'],
  limits:['No auto-grow. It stays `rows` tall and scrolls.',
          'The count only counts. It turns yellow at the limit, not before.']
},

's-togglegroup':{
  use:['One of two to five short options, all in view: a view, a period, a size.',
       'A setting that applies as soon as it is picked, or a value for a form. They are radios, so the form sends them.'],
  avoid:['Swapping panels of content. That is {s-tabs}.',
         'More options than fit on one line. That is a {s-select}.',
         'On and off. That is the switch in {s-toggles}.'],
  anatomy:{
    draw:['1   LIST    BOARD    CALENDAR  ',
          '    ^^^^    ^^^^^',
          '    2       3'],
    paint:['  mmmmmmmmAAAAAAAAAmmmmmmmmmmmm'],
    parts:[['.tgroup','group','`role="radiogroup"` with an `aria-label`. One row; it wraps on a narrow screen.'],
           ['.tgroup span','option','A `<label>` around an invisible radio and a `<span>`. The span is what you see, a muted word.'],
           ['input:checked + span','picked','The checked radio\'s span: an ink slab.']]},
  states:[['rest','  LIST  ','m','A muted word.'],
          ['checked',' BOARD  ','IIIIIII ','An ink slab.'],
          ['focus','  LIST  ','CCCCCCCC','A slab in the focus color, from the keyboard. The arrows pick as they go.'],
          ['no script','  LIST  ','m','Works as it is. They are radios.']],
  keys:[[['Tab'],'Lands on the checked option. The group is one Tab stop.'],
        [['ArrowLeft','ArrowRight'],'Picks the option before or after, and wraps. The browser does it: they are radios.'],
        [[' '],'Picks the focused option when none is picked.']],
  a11y:[['role','`role="radiogroup"` around native radios. A screen reader says "radio button, 2 of 3".'],
        ['name','Give the radiogroup an `aria-label`, or put it in a `<fieldset>` with a `<legend>`.'],
        ['state','Checked is the radio\'s own. Nothing to keep in step.'],
        ['live','The status line after it is `role="status"`. With `data-aui="segment"` the kit writes the pick there, on load and on every pick: the label\'s words, or `data-say` around them.'],
        ['touch','Each option is 45px tall with its padding.']],
  dos:[['Keep each label to a word or two, so the row fits a phone.','Put a sentence on a slab.'],
       ['Check one option in the HTML.','Leave all of them unchecked. It reads as broken, not as a choice.']],
  api:[['class','.tgroup','On the `role="radiogroup"`. Each option is a `<label>` with an `<input type="radio">` and a `<span>`.'],
       ['attr','name','One `name` per group. Pasted twice, the kit renames the second copy so the two do not fight.'],
       ['attr','checked','The option picked on load.'],
       ['attr','data-aui="segment"','On the `.tgroup`. Writes the pick into the nearest `role="status"`. Without it the radios work and the line stays as the HTML has it.'],
       ['attr','data-say="{label} view."','What it writes. `{label}` is the picked option\'s words. "{label}." when missing.'],
       ['event','aui:change','On the `.tgroup`, when a person picks. `detail`: `{ value, label, input }`. The radio\'s own `change` fires too.'],
       ['call','ASCIIUI.get(el)','`value`: the picked radio\'s value.']],
  see:['s-tabs','s-toggles','s-select'],
  limits:['One pick. For several, use checkboxes: {s-toggles}.']
},

's-toggles':{
  use:['Checkbox: a yes or no a person can change, alone or in a list. "Include archived projects".',
       'Radio: one of a few, in a `<fieldset>` whose `<legend>` asks the question.',
       'Switch: a setting that applies the moment it flips. Autoplay, sound.'],
  avoid:['A choice that waits for a Save button. That is a checkbox, not a switch.',
         'Two to five short options in a row. That is a {s-togglegroup}.',
         'An action. That is a {s-button}.'],
  anatomy:{
    draw:['1 [@] Show on home page',
          '  [ ] Include archived projects',
          '2 (@) Public',
          '3 [..@@] Autoplay motion',
          '  ^^^',
          '  4'],
    paint:['  ooo',
           '',
           '  ooo',
           '  ommooo'],
    parts:[['.check','label','A `<label>` around the input, the glyph and the words. The whole row takes the tap.'],
           ['input[type="radio"]','radio','( ) and (@). One `name` per group, in a `<fieldset>`.'],
           ['[role="switch"]','switch','A checkbox with `role="switch"` and a `.switch-track` in its glyph. The @@ moves right when it is on.'],
           ['.glyph','glyph','Paint, `aria-hidden`: [ ] and [@], lime when checked. The real input is invisible, under it.']]},
  states:[['rest','[ ] ( ) ','i','Brackets and parentheses in ink.'],
          ['checked','[@] (@) ','ooo ooo ','Lime, with @ inside.'],
          ['focus','[ ]     ','CCC     ','The glyph turns into a slab in the focus color.'],
          ['switch off','[@@..]  ','iiimmi  ','@@ at the left, dots after.'],
          ['switch on','[..@@]  ','ommooo  ','@@ at the right, in lime.'],
          ['no script','[ ] ( ) ','i','Works as it is. They are native inputs.']],
  keys:[[['Tab'],'To each checkbox and switch. A radio group is one Tab stop.'],
        [[' '],'Checks or unchecks a checkbox or a switch. On a radio, picks it.'],
        [['ArrowDown','ArrowUp'],'Between the radios of a group, picking as they go.']],
  a11y:[['role','Native checkbox and radio. `role="switch"` makes a checkbox read as on or off.'],
        ['name','The words in the label. A radio group gets its question from the `<legend>`.'],
        ['state','Checked is native. Nothing to keep in step.'],
        ['paint','The glyph is `aria-hidden` and its brackets are CSS content.'],
        ['touch','The label is the target, 12px above and below the row: 45px tall, as wide as the words.']],
  dos:[['Label the checked state: "Show on home page".','Ask "Hide from home page?" and hand people a double negative.'],
       ['Put radios in a `<fieldset>` with a `<legend>`.','Leave a lone radio. Once checked, it cannot be unchecked.']],
  api:[['class','.check','The `<label>`. The input goes first, then `<span class="glyph" aria-hidden="true">`, then the words.'],
       ['class','.glyph .switch-track','The paint. A switch holds `[<span class="switch-track"></span>]` in its glyph.'],
       ['attr','role="switch"','On a checkbox: the switch.'],
       ['attr','checked name','Native. `name` groups radios; pasted twice, the kit renames the second group.'],
       ['event','change','The input\'s own. The kit adds none.']],
  see:['s-togglegroup','s-select','s-button'],
  limits:['No look for `indeterminate`. A screen reader says it, the glyph shows [ ].',
          'A switch is sent with the form as a checkbox: its value when on, nothing when off.']
},

/* ---------------- Overlay ---------------- */

's-command':{
  use:['Jumping anywhere on a big site or app by typing: a page, a setting, a command.',
       'People who live on the keyboard. On this site / and Ctrl K open it.'],
  avoid:['The main navigation. Most people never press /. Keep the links on screen.',
         'A handful of actions on one thing. That is a {s-dropdown}.'],
  anatomy:{
    draw:['  =================',
          '1 :: OPEN SEARCH ::',
          '  =================',
          '2 or press [/]'],
    paint:['','','',
           '  mmmmmmmm'],
    parts:[['.btn','button','A {s-button} that opens Search.'],
           ['kbd','key','A {s-kbd}: the shortcut, written out next to the way in.']]},
  states:[['closed','========','i','The button and the key hint.'],
          ['open','@@@@@@@@','i','A modal dialog: a search field, and the results under it in groups.'],
          ['no match','- - - - ','m','The list says so, and the field keeps what you typed.'],
          ['no script','========','i','The button does nothing.']],
  keys:[[['/'],'Opens it from anywhere but a text field.'],
        [['Ctrl+K'],'Opens it too, and closes it again. Cmd K on a Mac.'],
        [['ArrowDown','ArrowUp'],'The next or the previous result. It wraps.'],
        [['Home','End'],'The first or the last result.'],
        [['PageDown','PageUp'],'The next or the previous group.'],
        [['Enter'],'Goes to the result.'],
        [['Escape'],'Clears the field. Pressed on an empty field, closes.']],
  a11y:[['role','The field is a `role="combobox"` that drives a `role="listbox"`. The focus stays in the field; `aria-activedescendant` says which result is picked.'],
        ['name','The dialog is named by its title, Search. The way in says its shortcuts with `aria-keyshortcuts`.'],
        ['live','How many results there are is said in a `role="status"` line as you type.'],
        ['focus','It opens with the focus in the field, and gives it back to what opened it.']],
  dos:[['Show the shortcut next to the way in, as here.','Hide the only way in behind a key.'],
       ['Match the words people type, not only the titles. Here "modal" finds Card and dialog.','Match titles letter by letter.']],
  see:['s-dropdown','s-kbd','s-input'],
  limits:['Not in the kit. A palette of your own starts from an {s-input} and a list of links.']
},

's-sheet':{
  use:['Filters, options or a short form on a phone, where a centered dialog would be cramped.',
       'A task that belongs to the page under it and ends with Apply or the [x].'],
  avoid:['A decision the page has to stop for. That is the dialog in {s-card}: centered, one question.',
         'Anything long enough to scroll twice. Give it a page.',
         'Actions on one thing. That is a {s-dropdown}.'],
  anatomy:{
    draw:['                    2',
          '                    v',
          '1 @@ FILTERS @@@@@ [x] @@@@@@',
          '  @@                       @@',
          '3 @@  [@] Only my orders   @@',
          '  @@  [ ] Overdue          @@',
          '  @@                       @@',
          '4 @@    RESET   APPLY      @@',
          '  @@@@@@@@@@@@@@@@@@@@@@@@@@@'],
    paint:['',
           '                    n',
           '    HHHHHHHHH',
           '',
           '      ooo',
           '',
           '',
           '        iiiii   HHHHH'],
    parts:[['dialog.sheet','sheet','A native `<dialog>` with `.sheet`: full width, on the bottom edge, 82% of the screen tall at most. It comes up in seven steps.'],
           ['.sheet-x','close','[x] in the title row, with `data-aui-close` and an `aria-label` that says what it closes.'],
           ['.body','body','The card body. It scrolls by itself when there is more than fits; the page behind it does not move.'],
           ['[data-aui-reset]','reset','Puts every field in the sheet back to what the HTML says.']]},
  states:[['closed','        ','m','Not drawn. The button is all there is.'],
          ['open','. . . . ','h','Up from the bottom in seven steps, over a veil of magenta periods. The page behind is inert and does not scroll.'],
          ['dragged','@@@@@@@@','i','On a touch screen a finger pulls it down by its title, a row at a time. Past a quarter of its height, or with a flick, it closes; short of that it goes back.'],
          ['reduced motion','@@@@@@@@','i','Up at once, no steps. It still follows a finger.'],
          ['no script','========','i','The button does nothing and the sheet stays closed.']],
  keys:[[['Enter',' '],'On the button: opens it. The focus goes to the field with `autofocus`, or the first one that takes it.'],
        [['Tab','Shift+Tab'],'Through the fields and buttons of the sheet. The page behind is out of reach.'],
        [['Escape'],'Closes it. The focus goes back to the button that opened it.']],
  a11y:[['role','A native `<dialog>`, opened with `showModal()`: modal, the page behind is inert.'],
        ['name','The kit names it by its `.bar-title` with `aria-labelledby`.'],
        ['focus','On open, the `autofocus` field takes the focus: here the first checkbox. On close, the focus goes back to the opener.'],
        ['live','Apply closes the sheet first, then the toast shows on the page and is read out.'],
        ['touch','A tap on the veil closes it, and so does a drag down: by its title and the grip of = above it, or from the top of what it holds when that is scrolled to the top. The [x] is 45px tall.']],
  dos:[['End it with one clear way out: Apply, and the [x].','Stack three buttons that all close it.'],
       ['Apply the filters when Apply is pressed.','Filter the page behind it on every tap, where nobody can see it happen.']],
  api:[['class','.sheet .sheet-x','On the `<dialog>`, and on its close button. The card inside is `tone-heavy`.'],
       ['attr','data-aui-open','On a button. Opens the `<dialog>` after it, in the same element. `data-aui-open="id"` opens that one.'],
       ['attr','data-aui-close','On a button in the sheet: closes it.'],
       ['attr','data-aui-reset','On a button in the sheet: puts every field back, then redraws what depends on them.'],
       ['attr','data-aui-toast','With `data-aui-close`: closes it, then says so.'],
       ['event','aui:reset','On the `<dialog>`, after a reset put the fields back. `detail`: `{}`.'],
       ['event','close','The dialog\'s own, however it closes.']],
  see:['s-card','s-toggles','s-button','s-dropdown'],
  limits:['With a mouse it does not drag: the [x], Escape or a click on the veil.',
          'Reset puts back what the HTML says, not what was there when the sheet opened.']
},

's-tooltip':{
  use:['A short hint on a control whose label is not the whole story: what "Ship it" does, and when.',
       'The name of a button that shows only a glyph, next to its `aria-label`.'],
  avoid:['Anything a person needs to finish the task. Put it on the page, near the field.',
         'Links or buttons. Nothing in a tooltip can be clicked.',
         'Errors. That is the message under an {s-input}.'],
  anatomy:{
    draw:['1  Deploys on a Friday ',
          '2   v',
          '  =============',
          '3 :: SHIP IT ::',
          '  ============='],
    paint:['  IIIIIIIIIIIIIIIIIIIII',
           '    i'],
    parts:[['.tip','tip','`role="tooltip"`: an ink slab above the trigger, one line. It types itself in from the left.'],
           ['.tip','arrow','A v under it, paint. On a touch screen the tip shows below and the arrow is ^.'],
           ['button','trigger','A {s-button}, a link, an input, or anything with `tabindex`. The kit points its `aria-describedby` at the tip.']]},
  states:[['hidden','        ','m','Clipped to nothing. It is on the page, not drawn.'],
          ['hover',' Deploys','IIIIIIII','A mouse on the trigger: it types in, in 12 steps. Not for a finger or a stylus.'],
          ['focus',' Deploys','IIIIIIII','The trigger has the focus: the same. On a touch screen, only a keyboard\'s focus shows it.'],
          ['on, after a tap',' Deploys','IIIIIIII','`.on`: shown below the trigger for 1.8 seconds.'],
          ['off, after Escape','        ','m','`.off`: put away until the pointer or the focus comes back.'],
          ['no script',' Deploys','IIIIIIII','Hover and focus still show it. That part is CSS. No tap, no Escape.']],
  keys:[[['Tab'],'Focus on the trigger shows it.'],
        [['Escape'],'Puts it away and leaves the focus where it is.']],
  a11y:[['role','`role="tooltip"` on the tip.'],
        ['name','It describes, it does not name. The kit sets `aria-describedby` on the trigger, so the tip is read after the label.'],
        ['focus','Nothing in it takes the focus. It cannot hold a link or a button.'],
        ['touch','Hover and focus do nothing on a touch screen. A tap shows it below, where the finger is not, for 1.8 seconds.'],
        ['paint','The arrow is CSS content with empty alt text.']],
  dos:[['Keep it to one line, read at a glance.','Write a paragraph. It does not wrap on a desktop and runs off the screen.'],
       ['Put it on something that takes the focus: a button, a link.','Put it on plain text, where a keyboard never reaches it.']],
  api:[['attr','data-aui="tooltip"','On the `.pop`. Adds the tap and Escape. Hover and focus are CSS.'],
       ['class','.pop .tip','The box around trigger and tip, and the tip.'],
       ['class','.on .off','Set by the kit: shown after a tap, put away after Escape.'],
       ['call','ASCIIUI.get(el)','`show()` for 1.8 seconds, `hide()` until the pointer or the focus comes back.']],
  see:['s-button','s-kbd','s-dropdown'],
  limits:['Always above the trigger, from its left edge, on a desktop. It does not flip near the top of the screen.',
          'One line on a desktop. It wraps only on touch.']
},

's-popover':{
  use:['A few controls that belong to one button and do not deserve a dialog: snooze for how long, rename in place, a short filter.',
       'Something the page can go on without while it is open. It is not modal: the page around it stays live.'],
  avoid:['A decision the page has to stop for. That is the dialog in {s-card}, or an {s-alertdialog} when it cannot be undone.',
         'A list of actions. That is a {s-dropdown}: a menu, arrows, one Tab stop.',
         'A hint. That is a {s-tooltip}: it takes no focus and holds no controls.',
         'A form of more than a few fields, or anything that needs the whole width of a phone. That is a {s-sheet}.'],
  anatomy:{
    draw:['1 ==============',
          '  :: SNOOZE v ::',
          '  ==============',
          '2 @@ SNOOZE API-GATEWAY @@@@',
          '  @@                      @@::',
          '3 @@  ( ) 15 minutes      @@::',
          '  @@  (@) 1 hour          @@::',
          '  @@                      @@::',
          '4 @@   CANCEL   SNOOZE    @@::',
          '  @@@@@@@@@@@@@@@@@@@@@@@@@@::',
          '    ::::::::::::::::::::::::::'],
    paint:['',
           '            m',
           '',
           '    HHHHHHHHHHHHHHHHHHH',
           '                            dd',
           '                            dd',
           '      ooo                   dd',
           '                            dd',
           '       iiiiii   HHHHHH      dd',
           '                            dd',
           '    dddddddddddddddddddddddddd'],
    parts:[['[aria-haspopup]','trigger','A {s-button} with `aria-haspopup="dialog"`. While the panel is open its rim is # and the kit keeps `aria-expanded` true.'],
           ['.bar-title','title','The card\'s title. The kit names the panel by it, with `aria-labelledby`.'],
           ['.pane','panel','A `.pane`, `hidden` until it opens. Where the browser has the Popover API the kit lifts it into the top layer, so no box that scrolls or clips cuts it off. It sits on the grid under the trigger, or above it when there is no room.'],
           ['[data-aui-close]','way out','Cancel and Snooze put it away and bring the focus back to the trigger.']]},
  states:[['closed','========','i','The panel is `hidden`, the trigger says `aria-expanded="false"`.'],
          ['open','########','i','The trigger\'s rim turns #, held open. The panel wipes in from the trigger\'s side, a row a step.'],
          ['open, above','@@@@@@@@','i','`.up` on the panel when there is no room under the trigger: it opens above and wipes in upwards.'],
          ['focus','@@@@@@@@','c','The trigger with the focus: the heavy rim in the focus color, open or not.'],
          ['reduced motion','@@@@@@@@','i','There at once, no wipe.'],
          ['no script','========','i','The trigger does nothing and the panel stays hidden.']],
  keys:[[['Enter',' '],'On the trigger: opens it, and the focus goes in, to `[autofocus]`, the first control, or the checked radio. Again: closes it.'],
        [['Escape'],'Closes it and puts the focus back on the trigger. A list inside that takes the Escape first keeps it open.'],
        [['Tab','Shift+Tab'],'Through the controls in it. Past the last one, or back before the first, it closes and the focus moves on.'],
        [['ArrowUp','ArrowDown'],'Between the radios in it, the browser way.']],
  a11y:[['role','`role="dialog"` on the panel, set by the kit when it has none. Not modal: the page is not inert and the focus is not trapped.'],
        ['name','The `.bar-title`, by `aria-labelledby`. A panel without a title needs an `aria-label`.'],
        ['state','`aria-expanded` and `aria-controls` on the trigger, kept by the kit.'],
        ['focus','Opening moves the focus in; Escape and a `data-aui-close` bring it back to the trigger. A click outside leaves it where the click put it.'],
        ['touch','A tap outside puts it away. The controls in it keep their 45px.'],
        ['paint','The rims, the walls and the shadow are paint. The v after the label is `aria-hidden`.']],
  dos:[['Keep it to one small task with a way out: Cancel and the action.','Fit a whole settings page into a popover.'],
       ['Put its fields in a `<form method="dialog">`: a wrong field keeps it open, a good one closes it.','Save on every keystroke, before anyone pressed Save.'],
       ['Name the trigger for what the panel does: "Snooze", "Rename".','Hide the only way to do something important behind it.']],
  api:[['attr','data-aui="popover"','On the `.pop`. The `[aria-haspopup]` button inside opens the `.pane` inside.'],
       ['class','.pop .pane','The box around trigger and panel, and the panel. A card in `tone-heavy` inside it.'],
       ['class','.open .up','Set by the kit on the panel: open, and opened above its trigger.'],
       ['attr','data-aui-close','On a button in the panel: puts it away and brings the focus back. With `data-aui-toast` it also says what happened.'],
       ['attr','method="dialog"','On a `<form>` in the panel: a send that passes the browser\'s checks closes it and brings the focus back.'],
       ['attr','data-aui="validate"','On a field in it, as in {s-input}: the words go under the field and the panel stays open. With `data-error-required`, `data-error-type`, `data-error-pattern`, `data-error-length`, `data-error-range` and `data-error` for the words.'],
       ['event','aui:toggle','On the `.pop`, when a person opens or closes it. `detail`: `{ open }`. Not for `open()` and `close()`.'],
       ['event','aui:invalid aui:valid','From a field inside that has `data-aui="validate"`, as in {s-input}.'],
       ['call','ASCIIUI.popover(el)','`open()`, `close()`, `toggle()`, `isOpen`. `open()` leaves the focus where it is.'],
       ['call','ASCIIUI.validate(form) ASCIIUI.get(input)','For the fields inside, as in {s-input}.'],
       ['css','--pcols','The width of the panel, in characters. 36 when missing.']],
  see:['s-dropdown','s-card','s-alertdialog','s-tooltip','s-sheet'],
  limits:['It opens under its trigger or above it, never to the side.',
          'Without the Popover API (Safari before 17, Firefox before 125) the panel stays in the page, and a box that scrolls or clips cuts it off.']
},

's-combobox':{
  use:['One value from a long list people search by name: a region, a city, a person, a project.',
       'A list too long for a {s-select} to scroll through, where people know how the thing they want starts.'],
  avoid:['Five to fifteen options people read through. That is a {s-select}: native, and a phone shows its own picker.',
         'Two to five options. That is a {s-togglegroup}: every choice in view, one tap.',
         'A search box. It takes only what is on the list, unless it has `data-free`. For a search, use an {s-input}.',
         'Several values. It picks one.'],
  anatomy:{
    draw:['1 Probe region',
          '2 ============================',
          '3 :: v f                    ::',
          '  ============================',
          '4 @@@@@@@@@@@@@@@@@@@@@@@@@@@@',
          '5 @@  fra-1, Frankfurt      @@',
          '  @@  sfo-1, San Francisco  @@',
          '  @@@@@@@@@@@@@@@@@@@@@@@@@@@@',
          '6 Pick a region from the list.'],
    paint:['',
           '',
           '     h i',
           '',
           '',
           '      CCCCCCCCCCCCCCCC',
           '',
           '',
           '  wwwwwwwwwwwwwwwwwwwwwwwwwwww'],
    parts:[['.field-label','label','A real `<label>`. It names the field, and the kit names the list by it too.'],
           ['.field','frame','The frame of the {s-input}. A tap anywhere on it opens the list; a tap on the v closes it again.'],
           ['input[role="combobox"]','field','The real input. What you type narrows the list: every word you type starts a word of the option, case and accents aside.'],
           ['.pane','list','A `.pane` with a card and a `role="listbox"`, as wide as the field. Six options in view, then it scrolls.'],
           ['[role="option"]','option','Two rows each. The one the arrows are on is a slab in the focus color, the pick is an ink slab.'],
           ['.error','error','Empty until you leave the field with words that are no option. Then `data-error-list` says so.']]},
  states:[['closed','========','i','The list is `hidden`, `aria-expanded="false"` on the field.'],
          ['focus','@@@@@@@@','c','The field has the focus: the heavy rim in the focus color.'],
          ['open','@@@@@@@@','i','The list under the field, or above it, label and all, when there is no room below. It wipes in.'],
          ['active option',' fra-1  ','CCCCCCCC','The option the arrows are on, `data-active`: a slab in the focus color. The caret stays in the field.'],
          ['selected',' iad-1  ','IIIIIIII','The pick, `aria-selected="true"`: an ink slab.'],
          ['option disabled',' mcm-1  ','m','`aria-disabled="true"`: gray. The arrows skip it and a click does nothing.'],
          ['nothing matches','No regi','m','The list says `data-empty`, or "Nothing matches.", and a screen reader hears it.'],
          ['invalid','!!!!!!!!','w','Left with words that are no option: a wall of ! and `data-error-list` under it.'],
          ['no script','========','i','A plain text field. The list stays closed.']],
  keys:[[['ArrowDown','ArrowUp'],'Opens the list on the pick, or on the first or the last option. Open: the next or the previous one, and it wraps. Gray options are skipped.'],
        [['Alt+ArrowDown'],'Opens the list on the pick, if there is one, and moves to no other option.'],
        [['PageDown','PageUp'],'Five options on, or five back.'],
        [['Enter'],'Picks the option the arrows are on and closes the list. With the list closed it settles the words first, so a form sends the pick or stops.'],
        [['Escape'],'Closes the list and puts the pick back in the field.'],
        [['Tab'],'Closes the list. Leaving settles the words: an option, nothing, or the error.']],
  a11y:[['role','`role="combobox"` on the input and a `role="listbox"` of `role="option"`. The kit adds `aria-controls`, `aria-autocomplete="list"`, `aria-expanded` and `autocomplete="off"`.'],
        ['focus','The focus stays in the field. The option the arrows are on is its `aria-activedescendant`, so a screen reader reads it as you move.'],
        ['name','The `<label>` names the field and the list.'],
        ['live','Half a second after you stop typing, a hidden live region says how many match, "3 matches.", or the `data-empty` words. The status line says the pick.'],
        ['state','`aria-selected="true"` on the pick. `aria-invalid` on the field when its words are no option.'],
        ['touch','Options are two rows, 42px. A tap on the frame opens the list.']],
  dos:[['Write options the way people search for them: "fra-1, Frankfurt", code and city.','List bare codes nobody would type.'],
       ['Say what went wrong in `data-error-list`: "Pick a region from the list."','Let the field keep words that match nothing, and send nothing.'],
       ['Gray out an option that exists but cannot be picked now, and say why in it: "(full)".','Take it off the list, so people think they typed it wrong.']],
  api:[['attr','data-aui="combobox"','On the `.combo`, around the `.field` and the `.pane`.'],
       ['class','.combo .opts .opts-none','The box, the list that scrolls, and the line that says nothing matches.'],
       ['attr','data-value','On an option: what it sends. On the `.combo`: the option picked on load. Followed live.'],
       ['attr','data-name="region"','Adds a hidden input with that name and the pick\'s `data-value`, for the form.'],
       ['attr','data-label','On an option: the words it is matched by and shows in the field, when its text says more.'],
       ['attr','data-empty','What the list says when nothing matches. "Nothing matches." when missing.'],
       ['attr','data-error-list','What it says when the field is left with words that are no option. "Pick one from the list." when missing.'],
       ['attr','data-free','Takes any words, not only an option. `aui:change` then has no `option`.'],
       ['attr','aria-disabled="true"','On an option: gray, skipped, never picked.'],
       ['attr','data-active','Set by the kit on the option the arrows are on. Style it, do not set it.'],
       ['event','aui:change','On the `.combo`, when a person picks or clears it. `detail`: `{ value, label, option }`.'],
       ['call','ASCIIUI.combobox(el)','`open()`, `close()`, `set(value)` (`null` clears it; `false` when no option has that value), `value`, `label`, `option`, `isOpen`.']],
  see:['s-select','s-input','s-dropdown','s-popover'],
  limits:['One pick, not several.',
          'It matches the start of words, case and accents aside: "sao" finds São Paulo, "aulo" finds nothing.',
          'The options are in the HTML. To fetch them as people type, replace the options from your script: the kit reads them again on the next key.']
},

's-alertdialog':{
  use:['A question before something that cannot be undone: delete a project, drop a workspace, revoke every key.',
       'The one time the page stops a person and makes them answer.'],
  avoid:['Anything that can be undone. Do it, say so in a {s-toast}, and offer a way back.',
         'A question that is not about losing something: publish, save. That is the dialog in {s-card}.',
         'A warning that stays on the page. That is an {s-alert}.'],
  anatomy:{
    draw:['5 . . . . . . . . . . . . . . .',
          '1 . // DELETE PROJECT? /////  .',
          '  . //                    //  .',
          '2 . //  Reporting goes    //  .',
          '  . //  for good.         //  .',
          '  . //                    //  .',
          '  . //  KEEP IT  DELETE   //  .',
          '  . ////////////////////////  .',
          '  . . . . . . . . . . . . . . .',
          '        ^^^^^^^  ^^^^^^',
          '        3        4'],
    paint:['  wwwwwwwwwwwwwwwwwwwwwwwwwwwww',
           '  w wwWWWWWWWWWWWWWWWWWwwwww  w',
           '  w ww                    ww  w',
           '  w ww                    ww  w',
           '  w ww                    ww  w',
           '  w ww                    ww  w',
           '  w ww  iiiiiii  wwwwww   ww  w',
           '  w wwwwwwwwwwwwwwwwwwwwwwww  w',
           '  wwwwwwwwwwwwwwwwwwwwwwwwwwwww'],
    parts:[['.alert','card','The {s-alert} card in `tone-danger`: a rim of /, the title on a yellow slab.'],
           ['.body > p','question','What goes, and that it does not come back. The kit describes the dialog by it.'],
           ['[autofocus]','safe','Keep it, first, with `autofocus`. It has the focus when the dialog opens, and again after a tap outside.'],
           ['.btn-danger','action','Delete, last, with `data-aui-close="delete"`: the dialog closes with that as its `returnValue`.'],
           ['dialog','veil','A native `<dialog>` with `role="alertdialog"`, over a veil of periods. Inside an `.alert` they are yellow.']]},
  states:[['closed','        ','m','Not drawn. The button is all there is.'],
          ['open','. . . . ','w','Modal, over yellow periods. The page behind is inert and does not scroll. The safe button has the focus.'],
          ['nudged','////////','w','A tap outside: the card jolts one character left, right, left, and the focus goes back to the safe button.'],
          ['danger disabled','- - - - ','m','With `data-aui="confirm"`: Delete stays `disabled` until the field holds the name.'],
          ['invalid','!!!!!!!!','w','The wrong name, on Enter, on leaving the field, or on a pause once it cannot become the name: a wall of ! and "Type static-prod exactly." under the field.'],
          ['reduced motion','////////','w','No jolt. The focus still goes back to the safe button.'],
          ['no script','////////','w','The button does nothing and the dialog stays closed.']],
  keys:[[['Enter',' '],'On the button: opens it. On a button in it: presses it. In the name field: with the right name it presses Delete, with the wrong one it says what to type.'],
        [['Tab','Shift+Tab'],'Between the field and the buttons. The page behind is out of reach.'],
        [['Escape'],'Closes it, the same as the safe button. `returnValue` stays empty.']],
  a11y:[['role','`role="alertdialog"` on a native `<dialog>`, opened with `showModal()`: modal, the page behind is inert.'],
        ['name','The kit names it by its `.bar-title` and describes it by its first paragraph, so the question is read as it opens.'],
        ['focus','The safe button has `autofocus`, so a stray Enter keeps the thing. On close, the focus goes back to the button that opened it.'],
        ['state','A danger button held off by `data-aui="confirm"` is `disabled`: out of the Tab order, and said so.'],
        ['touch','A tap outside does not close it. It nudges, so a thumb that missed deletes nothing.'],
        ['paint','The veil, the rims and the walls are paint.']],
  dos:[['Name what goes and say it does not come back: "Reporting redesign and its 14 comments go for good."','Ask "Are you sure?"'],
       ['Name the buttons for what they do: Keep it, Delete.','Offer Yes and No, or OK and Cancel.'],
       ['Ask for the name to be typed when a slip costs a lot: a workspace, not a comment.','Make people type a name to delete every small thing.']],
  api:[['attr','role="alertdialog"','On the `<dialog>`. A tap outside nudges it instead of closing it.'],
       ['class','.alert .lift','The {s-alert} card inside, `tone-danger`, and its shadow.'],
       ['attr','data-aui-open','On a button. Opens the dialog after it, in the same element.'],
       ['attr','data-aui-close="delete"','On the danger button: closes it with `returnValue` "delete". A plain `data-aui-close` leaves it empty.'],
       ['attr','autofocus','On the safe button. The focus lands there on open and after a nudge.'],
       ['attr','data-aui="confirm"','On a field in it, with `data-match="static-prod"`: the danger buttons stay off until the field holds exactly those words. It is empty every time the dialog opens.'],
       ['attr','data-error','On that field: what it says when the words are wrong (on Enter, on leaving the field, on a pause). "Type static-prod exactly." when missing.'],
       ['attr','data-aui-toast-err','On the danger button: a yellow toast once it closes.'],
       ['event','close','The dialog\'s own. Read `returnValue` there: "delete", or empty.'],
       ['call','ASCIIUI.get(input)','On the confirm field: `check()` and `ok`.']],
  see:['s-card','s-alert','s-toast','s-popover'],
  limits:['The name check is exact: case and spaces inside count, only the ends are trimmed.',
          'Escape counts as the safe answer, as for every dialog.']
},

's-contextmenu':{
  use:['Actions on a row or an item, where people look for them with the right mouse button: open, copy, assign, delete.',
       'A shortcut to actions that are also somewhere else on the page. Nobody finds a context menu by looking.'],
  avoid:['The only way to do something. Put it in a {s-dropdown} or on a {s-button} too: a right-click cannot be seen.',
         'A value to pick. That is a {s-select} or a {s-combobox}.',
         'Text people want to copy. Links and fields keep the browser\'s own menu; keep it on prose too.'],
  anatomy:{
    draw:['1 ID       SERVICE      STATUS',
          '2 INC-481  api-gateway  DOWN',
          '  INC-480 @@@@@@@@@@@@@@@@@@@@@@',
          '3         @@  Open        [o] @@',
          '4         @@  Copy ID     [c] @@',
          '5         @@  Undo            @@',
          '          @@  - - - - - - -   @@',
          '6         @@  Delete          @@',
          '          @@@@@@@@@@@@@@@@@@@@@@'],
    paint:['  IIIIIIIIIIIIIIIIIIIIIIIIIIII',
           '  v                    HHHH',
           '',
           '',
           '              IIIIIIIIIIIIIIII',
           '              mmmm',
           '              mmmmmmmmmmmmm',
           '              wwwwww'],
    parts:[['.ctx','area','Where `data-aui="contextmenu"` goes: around what the menu acts on, a table, a list, a board.'],
           ['tr[tabindex]','row','A row that takes the focus, so Shift F10 has something to open on. While the menu is open it wears `data-ctx`: a violet bar down its first character.'],
           ['.menu','menu','A `.menu.pane`, `role="menu"` with an `aria-label`, `hidden`. It opens where you pressed, on the grid, and to the left of the pointer when there is no room on the right.'],
           ['[role="menuitem"]','item','A button with `tabindex="-1"`. The one with the focus is an ink slab. The letter in its `<kbd>` picks it.'],
           ['[disabled]','off','`disabled`: gray, and the arrows and the letters skip it.'],
           ['.danger','danger','Yellow, a yellow slab under the focus. Last, after a rule.']]},
  states:[['closed','        ','m','The menu is `hidden`. The rows look like any rows.'],
          ['open','@@@@@@@@','i','Where you pressed, over the page. The first item has the focus.'],
          ['on a row','I       ','v','The row it acts on wears `data-ctx`: a violet bar in its first character.'],
          ['row selected',' INC-48 ','IIIIIIII','A row your script marks `aria-selected="true"`: an ink slab. The kit does not pick rows.'],
          ['item focus, hover','  Open  ','IIIIIIII','An ink slab, from the keyboard or a mouse.'],
          ['disabled','  Undo  ','m','`disabled`: gray, skipped.'],
          ['danger focus',' Delete ','WWWWWWWW','A yellow slab.'],
          ['no script','        ','m','The browser\'s own menu, as if the kit were not there.']],
  keys:[[['Shift+F10','ContextMenu'],'On a row, or anything focused in the area: opens the menu under it, two characters in.'],
        [['ArrowDown','ArrowUp'],'The next or the previous item, and it wraps. Gray items are skipped. A letter moves to the next item that starts with it.'],
        [['Home','End'],'The first or the last item.'],
        [['Enter',' '],'Picks the item and closes the menu. The letter in an item\'s `<kbd>` does the same from anywhere in the menu.'],
        [['Escape','Tab'],'Closes the menu and puts the focus back where it was.']],
  a11y:[['role','`role="menu"` of `role="menuitem"` buttons. The kit hides each `<kbd>` and says its letter as `aria-keyshortcuts`, so the item reads "Open", not "Open o".'],
        ['name','Give the menu an `aria-label` for what it acts on: "Incident".'],
        ['focus','Opening moves the focus to the first item; Escape, Tab and a pick bring it back. Give the rows `tabindex="0"`, or a keyboard cannot reach them.'],
        ['live','The nearest `role="status"` says what was picked, on what: "Copy ID: INC-481."'],
        ['touch','Press and hold half a second without moving. The menu that opens is this one, not the browser\'s, and it opens under the row, as the keyboard does, so it does not cover what it acts on. The text under the finger is not selected, and the finger lifting picks nothing.'],
        ['paint','The rims, the walls and the shadow are paint. The violet bar on the row is a shadow; in Windows High Contrast it is an outline.']],
  dos:[['Offer the same actions where people can see them: a row menu, a toolbar.','Hide the only Delete behind a right-click.'],
       ['Give every row `tabindex="0"`, so Shift F10 works on it.','Make it a menu for the mouse only.'],
       ['Keep it short: a few items, a rule, the one you cannot take back last.','Copy the browser\'s own menu into yours: Back, Reload, Print.']],
  api:[['attr','data-aui="contextmenu"','On the `.ctx`. The `role="menu"` inside opens on a right-click, a long press, Shift F10 or the ContextMenu key.'],
       ['class','.ctx .menu .pane','The area, and the menu, which is a pane.'],
       ['attr','data-ctx','Set by the kit on the row the open menu acts on. Style it, do not set it.'],
       ['attr','tabindex="0"','On the rows, so a keyboard reaches them.'],
       ['attr','disabled aria-disabled="true"','On an item: gray, skipped.'],
       ['event','aui:select','On the `.ctx`, when an item is picked. `detail`: `{ item, text, target }`. `text` leaves out the kbd letter; `target` is the row.'],
       ['call','ASCIIUI.contextmenu(el)','`open(target)`, on an element inside or at `{ x, y }` in the window; `close()`, `isOpen`, `target`.']],
  see:['s-dropdown','s-kbd','s-popover'],
  limits:['Shift and a right-click still get the browser\'s own menu, and so do links and text fields in the area.',
          'One level. No submenus, no items that check on and off.',
          'It closes when the page scrolls or the window changes size.']
},

/* ---------------- Display ---------------- */

's-avatar':{
  use:['A person or a team, as two initials on a slab: next to a name, in a list, on a card.',
       'A face: put an `<img>` in the slab.'],
  avoid:['A status. That is a {s-badge}.',
         'A button on its own. Put it inside a link or a button that says where it goes.'],
  anatomy:{
    draw:['                        ',
          '     AR      OP     DS   ',
          '                        ',
          '  ^^^^^^^^  ^^^^^',
          '  1         2'],
    paint:['  AAAAAAAA',
           '  AAAAAAAA  HHHHH  OOOOO',
           '  AAAAAAAA  HHHHH  OOOOO'],
    parts:[['.avatar','avatar','An ink slab 8 characters wide and 3 rows tall. `role="img"` and an `aria-label` with the full name.'],
           ['.avatar.sm','small','5 by 2. `.hot` and `.ok` color it.']]},
  states:[['initials','   AR   ','AAAAAAAA','Two letters on ink.'],
          ['picture','        ','AAAAAAAA','An `<img>` fills the slab, cropped to fit.'],
          ['no script','   AR   ','AAAAAAAA','The same. It is CSS.']],
  keys:[[['Tab'],'Passes it by. An avatar is a picture, not a control.']],
  a11y:[['role','`role="img"` and an `aria-label`: read as "Ana Ruiz, image". Initials alone are read as letters.'],
        ['name','Next to the name in text, it says the name twice. Give it `aria-hidden="true"` there instead of a label.'],
        ['paint','Color never carries meaning here: `.hot` and `.ok` are only a tint.']],
  dos:[['Use two letters: given name and family name.','Put a word in it. It is 8 characters wide, 5 when small.'],
       ['Name every picture avatar.','Leave a face unnamed.']],
  api:[['class','.avatar','The slab, 8 by 3.'],
       ['class','.sm .hot .ok','Small, magenta, lime.'],
       ['attr','role="img" aria-label','The name, for a screen reader.']],
  see:['s-badge','s-card'],
  limits:['On this site an avatar can be a picture run through the LCD. That is the site\'s engine; the kit takes an `<img>`.',
          'No status dot and no stacked group.']
},

's-badge':{
  use:['A status on a thing, in one word: Operational, Degraded, Down.',
       'A tag in brackets for what is not a status: Beta, New, Draft.'],
  avoid:['Something that happened a moment ago. That is a {s-toast}.',
         'A warning a person has to read. That is an {s-alert}.',
         'A filter people tap. A badge does nothing: use a {s-togglegroup}.'],
  anatomy:{
    draw:['1  OPERATIONAL    DEGRADED ',
          '2  DOWN   [BETA]',
          '          ^^^^^^',
          '          3'],
    paint:['  OOOOOOOOOOOOO  WWWWWWWWWW',
           '  HHHHHH  miiiim'],
    parts:[['.badge','slab','Uppercase on a color, bold, one line. `b-ok` lime, `b-warn` yellow.'],
           ['.b-hot','loud','Magenta. For the one thing that is broken.'],
           ['.b-out','tag','No slab: the word in brackets. For what is not a status.']]},
  states:[['ok',' UP     ','OOOO    ','`b-ok`: working, done, paid.'],
          ['warn',' SLOW   ','WWWWWW  ','`b-warn`: working, badly.'],
          ['hot',' DOWN   ','HHHHHH  ','`b-hot`: broken.'],
          ['tag','[BETA]  ','miiiim  ','`b-out`: a word in brackets.'],
          ['no script',' UP     ','OOOO    ','The same. It is CSS.']],
  keys:[[['Tab'],'Passes it by. A badge is text.']],
  a11y:[['name','The word is the status. The color only repeats it: "Down" says down in any color.'],
        ['role','A `<span>`, no role. It is read in place, after the name it sits next to.'],
        ['paint','The brackets of `b-out` are CSS content. Uppercase is CSS too, so the text stays as written.']],
  dos:[['One word, and the same word for the same state everywhere.','Say "Operational" on one page and "Up" on the next.'],
       ['One badge per thing.','Stack three on a row until none of them means anything.']],
  api:[['class','.badge','The slab. Ink when it has no color class.'],
       ['class','.b-ok .b-warn .b-hot','Lime, yellow, magenta.'],
       ['class','.b-out','The word in brackets, no slab.']],
  see:['s-alert','s-toast','s-avatar'],
  limits:['Four looks and no more. No violet badge, no dot.',
          'Not a control: no hover, no focus.']
},

's-details':{
  use:['Answers people look for one at a time: questions, fine print, the long version.',
       'Content that is fine to skip. It stays on the page, where find in page reaches it.'],
  avoid:['Anything most people need. Show it.',
         'Views of one thing where exactly one shows. That is {s-tabs}.',
         'Navigation. A list of links does that.'],
  anatomy:{
    draw:['1 [-] What ships in the kit?',
          '3     Twenty-eight components,',
          '      one CSS and one JS.',
          '4 - - - - - - - - - - - - - -',
          '2 [+] Can I change them?'],
    paint:['  ooo',
           '      mmmmmmmmmmmmmmmmmmmmmmmm',
           '      mmmmmmmmmmmmmmmmmmm',
           '  mmmmmmmmmmmmmmmmmmmmmmmmmmm',
           '  hhh'],
    parts:[['summary','question','The `<summary>`, after a [+] or [-]. The whole row takes the tap, 45px tall.'],
           ['.acc','details','A native `<details class="acc">`. Closed here. `open` starts it open.'],
           ['.acc p','answer','Indented 4 characters, muted.'],
           ['.acc','rule','A faint rule under each one, paint.']]},
  states:[['closed','[+]     ','hhh     ','[+] in magenta.'],
          ['open','[-]     ','ooo     ','[-] in lime, and the answer under it.'],
          ['focus','[+]     ','CCC     ','The marker turns into a slab in the focus color.'],
          ['no script','[+]     ','hhh     ','Opens and closes. It is native.']],
  keys:[[['Tab'],'To each question.'],
        [['Enter',' '],'Opens it, or closes it.']],
  a11y:[['role','Native `<details>` and `<summary>`: read as a button that is collapsed or expanded.'],
        ['paint','The marker is CSS content with empty alt text. The browser\'s own triangle is gone.'],
        ['focus','The focus stays on the question. The answer is next in reading order.']],
  dos:[['Write the question the way people ask it.','Title it with a noun: "Pricing".'],
       ['Keep answers to two or three lines.','Hide a whole page in one.']],
  api:[['class','.acc','On the `<details>`.'],
       ['attr','open','Starts it open. The browser keeps it in step.'],
       ['attr','name','The same `name` on several makes them close each other, in browsers that support it.'],
       ['event','toggle','The details\' own, on open and close.']],
  see:['s-tabs','s-card'],
  limits:['On this site the answer decodes as it opens and a sound plays. The kit opens it plainly.']
},

's-kbd':{
  use:['A shortcut, written the way the key looks: [/] search, [g] glitch.',
       'A key name inside a sentence: press [Esc] to close.'],
  avoid:['A button. A key hint does nothing when tapped.',
         'Code. That is `<code>`.',
         'A hint on a menu item that nobody can press. In a {s-dropdown} it becomes part of the item\'s name.'],
  anatomy:{
    draw:['1 [/] search      [g] glitch',
          '  [<] [>] move    [space] fire',
          '   ^',
          '   2'],
    parts:[['.kbds','grid','A grid of hints, 16 characters a column at least.'],
           ['kbd','key','The key in brackets, bold ink. The brackets are CSS content.']]},
  states:[['key','[/]     ','i','Bold ink in brackets.'],
          ['in a menu','[d]     ','III     ','Takes the color of its row, slab included.'],
          ['no script','[/]     ','i','The same. It is CSS.']],
  keys:[[['Tab'],'Passes it by. A kbd is text.']],
  a11y:[['name','Write the key out, `<kbd>space</kbd>`, not a glyph only a sighted person decodes. For < and > a screen reader says "less than" and "greater than".'],
        ['paint','The brackets are CSS content with empty alt text: a screen reader says the key, not "left bracket".'],
        ['state','Put `aria-keyshortcuts` on the control the shortcut runs. Then a screen reader says it there.']],
  dos:[['Show shortcuts that work on the page they are on.','List shortcuts that only work somewhere else.'],
       ['Write the key as it is printed on it: Esc, Tab, Ctrl.','Invent names: "the slash key thing".']],
  api:[['class','kbd','The element. Bold ink, in brackets.'],
       ['class','.kbds','A grid of hints.']],
  see:['s-command','s-tooltip','s-dropdown'],
  limits:['It shows a key. It does not bind one: the shortcut is your script.']
},

's-picture':{
  use:['A picture on this site: the four scenes, or your own photo, drawn as cells of three subpixels.',
       'Showing what the three modes do to the same image: RGB, Mono, ASCII.'],
  avoid:['A photo people need to see clearly. That is an `<img>`.',
         'Anything you paste from the kit. It is not in it: put an `<img>` in an {s-avatar} or a card.'],
  anatomy:{
    draw:['1 ...... :::::: ====== ++++++',
          '  ****** ###### %%%%%% @@@@@@',
          '  ++++++ ====== :::::: ......',
          '  ^^^^^^',
          '  2',
          '3   RGB    MONO    ASCII  ',
          '4 Buenos Aires, 19:42.'],
    paint:['  bbbbbbbbbbbbbbbbbbbbbbbbbbb',
           '  bbbbbbbbbbbbbbbbbbbbbbbbbbb',
           '  bbbbbbbbbbbbbbbbbbbbbbbbbbb',
           '','',
           '  AAAAAAAmmmmmmmmmmmmmmmmm',
           '  iiiiiiiiiiiiiiiiiiii'],
    parts:[['canvas.lcd','panel','A `<canvas>` with `role="img"` and an `aria-label` that says what is in it. 64 by 48 cells, drawn by the site\'s engine.'],
           ['canvas','sector','One of twelve, four across and three down. A tap moves it to the next mode, and it glitches for a beat.'],
           ['.tgroup','mode','A {s-togglegroup}: the mode of the whole panel. Picking one puts every sector back to it.'],
           ['figcaption','caption','What the picture is, in words. A photo you load says so here.']]},
  states:[['running','.:=+*#%@','b','The scene, moving, in the picked mode.'],
          ['sector tapped','@%#*+=:.','b','That sector goes to the next mode: RGB, Mono, ASCII.'],
          ['focus','@@@@@@@@','c','A rim in the focus color around the sector the arrows are on.'],
          ['your photo','.:=+*#%@','b','Cropped to fit. It never leaves the page.'],
          ['error','!!!!!!!!','w','A file that is not a picture says so in a toast.'],
          ['reduced motion','.:=+*#%@','b','Still. Drawn when something changes, never moving.'],
          ['no script','        ','m','An empty panel.']],
  keys:[[['Tab'],'To the panel, then the modes, then Load photo.'],
        [['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'],'Moves between the sectors. It stops at the edge.'],
        [['Enter',' '],'On a sector: what a tap does. On Load photo: opens the file picker.']],
  a11y:[['role','`role="img"` on the canvas, with an `aria-label` that says what is in the picture.'],
        ['name','The label stays with the scene, whatever the mode. The caption changes with the picture.'],
        ['focus','The canvas takes the focus, `tabindex="0"`, and draws the rim of the sector you are on.'],
        ['touch','A sector is a fourth of the panel wide. Hard to miss.']],
  dos:[['Say what is in the picture in its `aria-label`, as a sentence.','Label it "LCD canvas".'],
       ['Keep a plain `<img>` for photos that matter.','Push a product shot through the LCD and call it the product.']],
  see:['s-togglegroup','s-avatar','s-button'],
  limits:['Site only. The kit has no LCD.',
          'It redraws 8 times a second while it is on screen, and not at all when it is not.']
},

's-separator':{
  use:['A break between groups inside one box: settings in a card, items in a menu.',
       'A choice between two ways, with the word in the rule: or.'],
  avoid:['A box around things. That is a {s-card}.',
         'Space. A row of nothing does that, with no rule at all.',
         'A heading. A heading does that.'],
  anatomy:{
    draw:['1 @@@@@@@@@@@@@@@@@@@@@@@@',
          '2 ========================',
          '3 ::::::::::::::::::::::::',
          '4 - - - - - - - - - - - - ',
          '5 - - - - - or - - - - - -'],
    paint:['  hhhhhhhhhhhhhhhhhhhhhhhh',
           '',
           '  vvvvvvvvvvvvvvvvvvvvvvvv',
           '  mmmmmmmmmmmmmmmmmmmmmmmm',
           '  mmmmmmmmmmmmmmmmmmmmmmmm'],
    parts:[['.sepd.heavy','heavy','@ in magenta. The loudest break.'],
           ['.sepd','light','= in ink. The default.'],
           ['.sepd.shade','shade',': in violet.'],
           ['.sepd.faint','faint','- in muted. The quietest, and the one a menu uses.'],
           ['.sepl','labelled','A faint rule on each side of a word.']]},
  states:[['heavy','@@@@@@@@','h','`.heavy`.'],
          ['light','========','i','No class.'],
          ['shade','::::::::','v','`.shade`.'],
          ['faint','- - - - ','m','`.faint`.'],
          ['no script','========','i','The same. It is CSS.']],
  keys:[[['Tab'],'Passes it by. A rule is not a control.']],
  a11y:[['role','`role="separator"` on each one, so a screen reader can say where a group ends. A rule that only decorates takes `role="presentation"` instead.'],
        ['paint','The characters are CSS content with empty alt text. In `.sepl` the word is read, the dashes are not.']],
  dos:[['Give each weight one job, and keep it all through a page.','Mix four weights on one screen.'],
       ['Put the word in the rule when it is a choice: or.','Put a title in a rule. That is a heading.']],
  api:[['class','.sepd','The rule, one row tall, with a row above it.'],
       ['class','.heavy .shade .faint','The weights. No class is =.'],
       ['class','.sepl','The rule with a word in it.'],
       ['attr','role="separator"','On each one.']],
  see:['s-card','s-dropdown','s-timeline'],
  limits:['Across only. There is no rule that runs down.',
          'An `<hr>` is not styled. Use `<div class="sepd" role="separator">`.']
},

's-timeline':{
  use:['Things that happened, in order: a project log, a release history, a delivery.',
       'Newest first, with the one that is now at the top.'],
  avoid:['Steps a person has yet to take. Number them in a plain list.',
         'Things with no order. That is a plain list.',
         'News that arrives while you read. Say it in a {s-toast}; the timeline is the record.'],
  anatomy:{
    draw:['1 @@  SHIPPED',
          '  ::  Search v2 went to 100',
          '  ::  percent of accounts.',
          '2 ##  IN REVIEW',
          '  ::  14 comments in Figma.',
          '3 ##  KICKOFF'],
    paint:['  hh',
           '  vv  mmmmmmmmmmmmmmmmmmmmm',
           '  vv  mmmmmmmmmmmmmmmmmmmm',
           '  ii',
           '  vv  mmmmmmmmmmmmmmmmmmmmm',
           '  ii'],
    parts:[['li','now','@@ in magenta. Its `<b>` is the title, uppercase; its `<span>` says what happened, muted.'],
           ['li.past','past','`.past`: ## in ink. Done and behind.'],
           ['li:last-child','last','No wire under the last one. The wire is colons, in violet.']]},
  states:[['now','@@      ','h','A plain `<li>`: @@ in magenta.'],
          ['past','##      ','i','`.past`: ## in ink.'],
          ['no script','@@      ','h','The same. It is CSS.']],
  keys:[[['Tab'],'Passes it by, or stops at the links you put in it.']],
  a11y:[['role','An `<ol>`: read as "list, 3 items", in order.'],
        ['state','Now or past is told only by the character. Say it in the words too, or with a `<time>`.'],
        ['paint','Nodes and wire are CSS content with empty alt text.']],
  dos:[['Keep newest on top, and the same order on every page.','Flip the order between two pages.'],
       ['Give each item a date, in a `<time datetime>`.','Leave people to guess when "In review" was.']],
  api:[['class','.timeline','On the `<ol>`.'],
       ['class','.past','On an `<li>` that is behind.'],
       ['attr','datetime','On a `<time>` in an item: violet and bold.']],
  see:['s-separator','s-badge','s-alert'],
  limits:['Two looks, now and past. No failed or skipped item.',
          'No links or buttons of its own. Put them in an item.']
},

/* ---------------- Feedback ---------------- */

's-alert':{
  use:['Something on this page a person has to know before they carry on: an outage, a limit, a change.',
       'Info, `.info` in violet: worth knowing, nothing to do.'],
  avoid:['What happened after a click. That is a {s-toast}.',
         'A decision. That is the dialog in {s-card}.',
         'An error on one field. That is the message under an {s-input}.'],
  anatomy:{
    draw:['1 // SIGNAL LOST ///////////',
          '  //                      //::',
          '3 //  Probes from 3       //::',
          '  //  regions time out.   //::',
          '2 //////////////////////////::',
          '    ::::::::::::::::::::::::::',
          '4 == HEADS UP ================'],
    paint:['  wwWWWWWWWWWWWWWwwwwwwwwwww',
           '  ww                      wwdd',
           '  wwiiiiiiiiiiiiiiiiiiiiiiwwdd',
           '  ww                      wwdd',
           '  wwwwwwwwwwwwwwwwwwwwwwwwwwdd',
           '    dddddddddddddddddddddddddd',
           '  vvVVVVVVVVVVvvvvvvvvvvvvvvvv'],
    parts:[['.bar-title','title','What happened, in a few words, on a yellow slab.'],
           ['.alert','rim','`.alert` makes the rim yellow; `tone-danger` draws it in /. `.lift` casts the shadow.'],
           ['.body','body','What to do about it, in a sentence or two.'],
           ['.alert.info','info','`.info` with `tone-light`: violet, =. Violet, because cyan is the focus color.']]},
  states:[['warning','////////','w','`.alert` with `tone-danger`.'],
          ['info','========','v','`.alert.info` with `tone-light`.'],
          ['no script','////////','w','The same. It is CSS.']],
  keys:[[['Tab'],'Passes it by, or stops at the links and buttons in it.']],
  a11y:[['role','`role="note"`: read in place, not announced. One that appears while the page is open needs `role="alert"`, and only that one.'],
        ['name','The title is a `<span>`. Make it a heading when the alert opens a section.'],
        ['paint','The rim and the shadow are CSS content with empty alt text. The title says it in words; the yellow only repeats it.']],
  dos:[['Say what happened in the title and what to do in the body.','Write "Error" in the title and nothing useful under it.'],
       ['One alert on a page at a time.','Stack three. The third one is wallpaper.']],
  api:[['class','.alert .info','The hazard box, and its violet one.'],
       ['class','.lift .card .bar-title .body','The card inside it, as in {s-card}. `tone-danger` for the warning, `tone-light` for info.'],
       ['attr','role="note"','On the `.alert`.']],
  see:['s-toast','s-card','s-badge','s-empty'],
  limits:['No close button. It stays until the page takes it away.',
          'Yellow or violet. Good news is a {s-toast}, not a lime alert.']
},

's-empty':{
  use:['A list, a table or a search with nothing in it yet. Say so, and offer the one next step.'],
  avoid:['An error. Nothing loaded is not the same as nothing there: say what broke, in an {s-alert}.',
         'Loading. That is a {s-skeleton}.'],
  anatomy:{
    draw:['1 @@ NO WORK ORDERS @@@@@@@@',
          '  :                       : ::',
          '3 :   Nothing is broken.  : ::',
          '  :   Enjoy it.           : ::',
          '  :                       : ::',
          '4 :     CREATE WORK ORDER : ::',
          '2 - - - - - - - - - - - - - ::',
          '    ::::::::::::::::::::::::::'],
    paint:['    HHHHHHHHHHHHHHHH',
           '  m                       m dd',
           '  m   mmmmmmmmmmmmmmmmmm  m dd',
           '  m   mmmmmmmmm           m dd',
           '  m                       m dd',
           '  m    HHHHHHHHHHHHHHHHHH m dd',
           '  mmmmmmmmmmmmmmmmmmmmmmmmm dd',
           '    dddddddddddddddddddddddddd'],
    parts:[['.bar-title','title','What is not there, in plain words: "No work orders". The top rim is @, as on every card.'],
           ['.card','frame','`tone-faint`: the quietest rim. Nothing to see, and it looks it.'],
           ['.body p','line','One line, muted. A joke is fine; blame is not.'],
           ['.btn-primary','next step','The one thing to do next, as a primary {s-button}.']]},
  states:[['empty','- - - - ','m','The only state it has. When there is something, show the thing.'],
          ['no script','- - - - ','m','The card shows. The button does nothing, unless it is a link.']],
  keys:[[['Tab'],'To the button.'],
        [['Enter',' '],'Presses it.']],
  a11y:[['name','The title is a `<span>`. Make it a heading when the card stands in for a whole section.'],
        ['live','It is not announced when it shows up. After a search that finds nothing, say so in a `role="status"` too.'],
        ['paint','The rims and the shadow are paint.']],
  dos:[['Offer one next step.','Offer four, or none.'],
       ['Say why it is empty, when you know: "No results for fra-2".','Show a table with its headers and nothing under them.']],
  api:[['class','.lift .card .tone-faint','The card, faint.'],
       ['class','.bar-title .body','The title on the rim, and the walls with the line and the button.'],
       ['attr','data-aui-toast','On the button in the demo: a lime toast. Yours creates the thing.']],
  see:['s-card','s-alert','s-skeleton','s-button'],
  limits:['It does not know when a list is empty. Your script shows it and takes it away.']
},

's-progress':{
  use:['A task with a known end that takes more than a second: an export, an upload.',
       'When you can say how far along it is. The number goes next to the bar.'],
  avoid:['A wait with no end you can measure. That is a {s-spinner}.',
         'A value a person sets. That is a {s-slider}.',
         'Content loading into place. That is a {s-skeleton}.'],
  anatomy:{
    draw:['1 @@@@%#*+=:..............   42%',
          '  ^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^',
          '  2                         3',
          '  =====================',
          '4 :: / EXPORT REPORT ::',
          '  ====================='],
    paint:['  bbbbbbbbbbbbbbbbbbbbbbbb  iiii'],
    parts:[['[role="progressbar"]','progress','`role="progressbar"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and an `aria-label` that says what is running.'],
           ['.bar','bar','Paint, `aria-hidden`, drawn from `aria-valuenow`. 24 cells; `data-cells` sets how many.'],
           ['.pct','percent','The number, 4 characters, padded on the left so the bar does not move. `aria-hidden`: the value is on the progressbar.'],
           ['[data-aui-fill]','demo button','Runs the bar from 0 to 100 with a spinner in its label, for demos. Your task sets `aria-valuenow` instead.']]},
  states:[['empty','........','m','0: all dots. Where it starts.'],
          ['running','@@%#*+=.','b','Full to `aria-valuenow`, 0 to 100, rounded.'],
          ['done','@@@@@@@@','b','100. The demo button says so in the status line next to it, or in a toast when there is none.'],
          ['no script','........','m','The bar stays empty.']],
  keys:[[['Tab'],'Passes the bar by. It is not a control.'],
        [['Enter',' '],'On the demo button: starts it. The button is `disabled` until it ends.']],
  a11y:[['role','`role="progressbar"`: a screen reader reads its value as a percent when it gets there.'],
        ['live','It is not announced as it moves. Say the end in the `role="status"` next to it: `data-aui-done` does that for the demo button.'],
        ['state','The demo button is `disabled` while it runs, so it cannot start twice.'],
        ['paint','The bar and the number are `aria-hidden`.']],
  dos:[['Say what is running, in the `aria-label` and on the button.','Label it "Progress".'],
       ['Say when it is done, in words.','Let the bar reach 100 and leave people to notice.']],
  api:[['attr','data-aui="progress"','On the `role="progressbar"`. Draws the bar and the number from `aria-valuenow`.'],
       ['attr','aria-valuenow','0 to 100. Change it and the bar redraws.'],
       ['attr','data-cells="24"','How many cells the bar has. 24 when missing. Followed live.'],
       ['attr','data-aui-fill','On a button: runs the nearest bar from 0 to 100, for demos.'],
       ['attr','data-aui-done','With `data-aui-fill`: what it says at the end. "Done." when missing.'],
       ['class','.progress .bar .pct','The box, the bar and the number.'],
       ['call','ASCIIUI.progress(el, pct)','Sets `aria-valuenow`, rounded, 0 to 100.'],
       ['call','ASCIIUI.get(el)','`draw()`, `set(p)`, and `value`.']],
  see:['s-spinner','s-skeleton','s-slider','s-button'],
  limits:['Whole percents, 0 to 100. `aria-valuemax` is not read: 100 is the end.',
          'No look for a task that failed. Say it in the status line, or in a {s-toast}.']
},

's-skeleton':{
  use:['A card or a list that is loading, when you know its shape: a silhouette where it will be.',
       'Waits of a second or two.'],
  avoid:['A wait with a known end. That is {s-progress}.',
         'Nothing to show. That is {s-empty}.',
         'A wait of more than a few seconds. Say what is happening, with a {s-spinner} and words.'],
  anatomy:{
    draw:['1 - - - - - - - - - - - - - -',
          '2 .:=+*#*+=:.',
          '  .:=+*##*+=:..:=+*##*+=:..:=',
          '  =+*##*+=:..:=+*##*+',
          '',
          '  - - - - - - - - - - - - - -',
          '3 "Loading", read, not drawn'],
    paint:['  mmmmmmmmmmmmmmmmmmmmmmmmmmm',
           '  mmmmmmmmmmm',
           '  mmmmmmmmmmmmmmmmmmmmmmmmmmm',
           '  mmmmmmmmmmmmmmmmmmm',
           '',
           '  mmmmmmmmmmmmmmmmmmmmmmmmmmm',
           '  mmmmmmmmmmmmmmmmmmmmmmmmmm'],
    parts:[['.skel','box','A `<pre>`, `aria-hidden`. The kit fills it with a card: a rule, three lines, a gap, a rule. 12 to 60 characters, as wide as its box.'],
           ['.skel','wave','The lines are the ramp, `.:=+*#`, with a wave moving through them 8 times a second.'],
           ['.vh','label','"Loading", for screen readers only, next to it.']]},
  states:[['loading','.:=+*#*+','m','The wave moves through the ramp, only while it is on screen.'],
          ['reduced motion','.:=+*#*+','m','One frame, still.'],
          ['no script','        ','m','Empty. The `<pre>` has nothing in it.']],
  keys:[[['Tab'],'Passes it by. Nothing in it takes the focus.']],
  a11y:[['paint','`aria-hidden` on the `<pre>`: nobody hears rows of dots.'],
        ['name','"Loading" is a `.vh` span, read in place. It is not announced.'],
        ['live','When the content arrives, it takes the skeleton\'s place. Announce it only if people wait for it.']],
  dos:[['Match the shape of what is coming.','Show a card silhouette where a table will be.'],
       ['Swap it for the content in one go.','Leave it up after the content has landed next to it.']],
  api:[['attr','data-aui="skeleton"','On a `<pre class="skel">`. Draws the card and runs the wave.'],
       ['class','.skel','The box. Muted, 6 rows tall at least.'],
       ['call','ASCIIUI.get(el).draw()','Draws the next frame. The kit calls it by itself; you rarely need to.']],
  see:['s-spinner','s-progress','s-empty'],
  limits:['One shape: a card. For a list or a table, draw your own lines of the ramp.',
          'It does not say how long. A long wait needs words.']
},

's-spinner':{
  use:['A wait with no end you can measure, inside the thing that waits: a button, a row, a status line.',
       'Short waits. Past a few seconds, add words.'],
  avoid:['A task with a known end. That is {s-progress}.',
         'A page loading its content. That is a {s-skeleton}.'],
  anatomy:{
    draw:['1 /        classic',
          '  =+*      ramp',
          '  [  =  ]  bounce',
          '  ..       dots',
          '  @%#*+=:. fill',
          '  ^^^^^^^^ ^^^^',
          '  2        3'],
    paint:['  h',
           '  hhh',
           '  hhhhhhh',
           '  hh',
           '  hhhhhhhh'],
    parts:[['.spins','grid','The demo\'s grid, 14 characters a column. Your spinner sits where the wait is.'],
           ['[data-aui="spinner"]','spinner','A `<b>` or a `<span>`, 8 characters wide at least, magenta. The kit writes a new frame into it 9 times a second.'],
           ['span','words','What is waiting, in words. The spinner alone says nothing.']]},
  states:[['spinning','/       ','h','A new frame every 110ms, only while it is on screen.'],
          ['reduced motion','|       ','h','The first frame, still. | for classic.'],
          ['no script','        ','m','Empty. Nothing moves.']],
  keys:[[['Tab'],'Passes it by. A spinner is not a control.']],
  a11y:[['role','The demo is `role="img"` with an `aria-label`. A spinner of yours sits next to words that say what is waiting.'],
        ['paint','The frames are text, so the kit hides them: without an `aria-label` a spinner is `aria-hidden`, with one it is `role="img"` and read as that word, once, not "slash".']],
  dos:[['Put it where the wait is, next to the words for it.','Spin in a corner while the button a person pressed looks idle.'],
       ['Take it away the moment the wait ends.','Leave it spinning after an error.']],
  api:[['attr','data-aui="spinner"','On a `<b>` or a `<span>`. Runs the frames.'],
       ['attr','data-kind="classic"','`classic`, `ramp`, `bounce`, `dots` or `fill`. Classic when missing. Followed live.'],
       ['attr','aria-label="Loading"','Names the wait: the spinner is read as that word. Without one the spinner is hidden from screen readers, and the words next to it say what is waiting.'],
       ['class','.spins','A grid of them, for a page like this one.']],
  see:['s-progress','s-skeleton','s-button'],
  limits:['No stop call. Take the element away, or its `data-aui`, and the kit tears it down.']
},

's-toast':{
  use:['Saying that something happened because of what a person did: saved, copied, sent.',
       'Yellow, `data-aui-toast-err`, for what did not work, when the person can try again.'],
  avoid:['Anything a person must read or act on. It is gone in seconds. That is an {s-alert}.',
         'A question. That is the dialog in {s-card}.',
         'Errors on a form. They go under the field, in an {s-input}.'],
  anatomy:{
    draw:['1  @@ Changes saved. ',
          '2  !! Something broke. ',
          '  ==================',
          '3 :: SAVE CHANGES ::',
          '  =================='],
    paint:['  OOOOOOOOOOOOOOOOOOO',
           '  WWWWWWWWWWWWWWWWWWWWW'],
    parts:[['.toast','good','Lime, marked @@, with [x] at the end. One line, typed in from the left.'],
           ['.toast.err','bad','`.err`: yellow, marked !!.'],
           ['[data-aui-toast]','button','Any button with `data-aui-toast="Saved."`: the words are the value.']]},
  states:[['hidden','        ','m','Clipped to nothing, until the next one.'],
          ['on',' @@ Save','OOOOOOOO','Types in, in 12 steps. It stays 3.6 seconds, longer for longer words (60ms a character, 15 seconds at most), and holds while a pointer or the focus is on it. On a desktop it sits at the bottom; on a phone, at the top.'],
          ['dismissed','        ','m','[x] puts it away at once, and the focus goes back to where it was.'],
          ['error',' !! Nope','WWWWWWWW','`.err`: yellow.'],
          ['in a dialog',' @@ Save','OOOOOOOO','While a modal dialog is open it goes inside it, so it sits on top and is read out.'],
          ['no script','        ','m','Nothing shows.']],
  keys:[[['Enter',' '],'On the button: shows it.'],
        [['Tab'],'The [x] is at the end of the page, or of the open dialog, so Tab reaches it last. While it has the focus the toast stays.']],
  a11y:[['live','Good news goes into a `role="status"` region: read after whatever is being said. An error goes into a `role="alert"` one: read at once. The focus stays put.'],
        ['state','The kit makes the regions first and writes the words a beat later, so the change is heard.'],
        ['name','@@ and !! are paint, `aria-hidden`. A screen reader hears the words and nothing else. The [x] is "Dismiss".'],
        ['touch','On a phone it drops in from the top, away from the thumb that tapped.']],
  dos:[['Say what happened, in a few words: "Changes saved."','Say "Success!".'],
       ['Show one for what a person did.','Toast every background sync.']],
  api:[['attr','data-aui-toast','On a button: a lime toast on click. The words are the value: `data-aui-toast="Saved."`.'],
       ['attr','data-aui-toast-err','On a button: a yellow one.'],
       ['call','ASCIIUI.toast(msg, err)','Shows one from a script. `err` makes it yellow.'],
       ['class','.toast .err .on .toast-x','Made by the kit, once, at the end of the page, and its [x].'],
       ['css','--aui-toast','The shortest a toast stays: 3.6s. Longer words stay longer.']],
  see:['s-alert','s-button','s-card'],
  limits:['One at a time. A new one replaces the last.',
          'No action in it and no swipe to put it away. The [x] does that.']
},

/* ---------------- Navigation ---------------- */

's-breadcrumb':{
  use:['Where this page sits in a tree of pages, and the way back up: Workspace / Projects / Signal.',
       'Sites more than two levels deep.'],
  avoid:['The steps of a task. Number them in a plain list.',
         'Views of one thing. That is {s-tabs}.',
         'A site one level deep. The page title says it all.'],
  anatomy:{
    draw:['Workspace / Projects /  Signal ',
          '^^^^^^^^^ ^            ^^^^^^^^',
          '1         2            3'],
    paint:['mmmmmmmmm h mmmmmmmm h IIIIIIII'],
    parts:[['a','link','A link to the page above, muted. It underlines on hover.'],
           ['li + li','slash','/ in magenta, CSS content with empty alt text.'],
           ['[aria-current]','current','This page: `aria-current="page"` on its `<li>`, the words in a `<span>` on an ink slab. Not a link.']]},
  states:[['link','Projects','m','Muted.'],
          ['hover','Projects','i','Ink and underlined. Mouse only.'],
          ['focus','Projects','C','A slab in the focus color.'],
          ['current',' Signal ','I','An ink slab, bold.'],
          ['no script','Projects','m','Works as it is. They are links.']],
  keys:[[['Tab'],'To each link.'],
        [['Enter'],'Follows it.']],
  a11y:[['role','A `<nav aria-label="Breadcrumb">` around an `<ol>`: a landmark, and a list in order.'],
        ['state','`aria-current="page"` on the last one: read as "current page".'],
        ['paint','The slashes are CSS content with empty alt text.'],
        ['touch','Each link takes the tap 12px above and below: 45px tall.']],
  dos:[['Start at the top of the tree and end at this page.','Put in the pages a person happened to click through. That is the Back button.'],
       ['Use the page titles, word for word.','Shorten "Projects" to "Proj."']],
  api:[['class','.crumbs','On the `<ol>`.'],
       ['attr','aria-current="page"','On the `<li>` of this page. Its words go in a `<span>`.'],
       ['attr','aria-label="Breadcrumb"','On the `<nav>`.']],
  see:['s-tabs','s-pagination'],
  limits:['No collapsing. A long trail wraps onto a second row.',
          'No menu on a crumb.']
},

's-pagination':{
  use:['Long lists split into pages a person moves through: results, orders, logs.',
       'When the page number matters. With `data-href`, page 3 is a link that stays page 3.'],
  avoid:['A few items. Show them all.',
         'The steps of a task. That is Back and Next, two {s-button}s.',
         'A feed people scroll. A button at the end that loads more.'],
  anatomy:{
    draw:['1 [<] [1] .. [3] .. [9] [>]',
          '  ^^^     ^^ ^^^',
          '  2       3  4',
          '5 Page 3 of 9.'],
    paint:['  mim mim mm III mm mim mim',
           '','',
           '  mmmmmmmmmmmm'],
    parts:[['[data-aui="pagination"]','nav','A `<nav aria-label="Pagination">`, empty. The kit draws into it from `data-pages` and `data-page`. This is the phone width; a wider box shows a page on each side of the current one.'],
           ['.ibtn','step','[<] and [>]. `disabled` on the first and the last page.'],
           ['.muted','gap','.. where pages are left out. `aria-hidden`.'],
           ['[aria-current="page"]','current','The page you are on: an ink slab, brackets and all.'],
           ['[role="status"]','status','The nearest one says "Page 3 of 9."']]},
  states:[['page','[4]     ','mim     ','A number in brackets.'],
          ['current','[3]     ','III     ','An ink slab, and `aria-current="page"`.'],
          ['focus','[4]     ','CCC     ','A slab in the focus color, brackets and all. On the current page too.'],
          ['disabled','[<]     ','mmm     ','[<] on the first page, [>] on the last: gray and `disabled`.'],
          ['narrow','[3] ..  ','III mm  ','Under 374px it drops the neighbours instead of shrinking the targets.'],
          ['no script','        ','m','Nothing is drawn. Put plain links in the nav as a fallback: the script replaces them.']],
  keys:[[['Tab'],'To each page, and to [<] and [>].'],
        [['Enter',' '],'Goes to that page. The focus moves to the new current page.']],
  a11y:[['role','A `<nav>` with an `aria-label`: a landmark.'],
        ['name','Each button is named: "Page 3", "Previous page", "Next page".'],
        ['state','`aria-current="page"` on the page you are on.'],
        ['live','The status line is `role="status"`: it reads "Page 3 of 9." after a pick.'],
        ['touch','Every page is 5 characters wide and 45px tall.']],
  dos:[['Use `data-href` when each page has an address.','Use buttons for pages people want to share or bookmark.'],
       ['Say the total: "Page 3 of 9."','Hide how many pages there are.']],
  api:[['attr','data-aui="pagination"','On an empty `<nav>`. Draws the pages.'],
       ['attr','data-pages="9"','How many pages. 9 when missing. Followed live.'],
       ['attr','data-page','The page, from 1. Past the end, the last one is drawn and the number is kept.'],
       ['attr','data-href="?page={n}"','Draws links instead of buttons. A link goes, so no event.'],
       ['class','.ibtn','Each page, and [<] [>]: a character in brackets.'],
       ['event','aui:change','On the `<nav>`, when a person picks a page. `detail`: `{ page }`. Buttons only.'],
       ['call','ASCIIUI.pagination(el)','`set(n)`, and `page` and `pages`.']],
  see:['s-breadcrumb','s-tabs','s-button'],
  limits:['No page size picker and no field to type a page.',
          'With `data-href` each pick loads a new page: no event, and the status changes when it lands.']
}

};

(function(){
'use strict';
const A=window.AUI;if(!A)return;
const D=window.AUI_DOCS||{};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nameOf=id=>{const h=document.getElementById(id);return h?h.textContent.trim():''};
const href=id=>'#components/'+id.replace(/^s-/,'');
const cap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;
/* text as it is written in AUI_DOCS: `code`, and {s-id} for a link. Short
   code never breaks at its hyphens; a long snippet wraps anywhere */
function inline(s){
  return esc(s).replace(/`([^`]+)`/g,(m,c)=>'<code'+(c.replace(/&[a-z]+;/g,'x').length>24?' class="u-long"':'')+'>'+c+'</code>')
    .replace(/\{(s-[a-z0-9-]+)\}/g,(m,id)=>{const n=nameOf(id);return n?'<a class="inl" href="'+href(id)+'">'+esc(n)+'</a>':esc(id)});
}
/* the same text without markup: teasers, the markdown reference, llms */
const plain=s=>String(s).replace(/`([^`]+)`/g,'$1').replace(/\{(s-[a-z0-9-]+)\}/g,(m,id)=>nameOf(id)||id);

/* ---- drawings: rows of characters, a row of color codes under each ---- */
const COL={i:'ink',m:'muted',h:'hot',p:'pink',v:'violet',d:'deep',o:'ok',w:'warn',c:'cy',n:'violet',a:'ink'};
const HUE={'@':'hot','%':'hot','#':'pink','*':'pink','+':'warn','=':'warn',':':'ink','.':'muted'};
const ART=/^[^A-Za-z0-9]+$/;   /* a run without letters or digits is paint: bold, and it follows the ramp */
const TR=t=>A.TR?A.TR(t):t;
function cell(p,t){
  if(p.length===2)return '<span class="f" style="color:var(--'+(HUE[p.charAt(1)]||'ink')+')">'+esc(TR(t))+'</span>';
  const slab=p>='A'&&p<='Z',k=p.toLowerCase(),col=COL[k]||'ink',art=!slab&&k!=='n'&&ART.test(t);
  if(slab)return '<span class="u-slab'+(p==='A'?' u-edge':p==='H'?' u-edge u-h2':'')+'" style="background:var(--'+col+')">'+esc(t)+'</span>';
  return '<span'+(art?' class="f"':'')+' style="color:var(--'+col+')">'+esc(art?TR(t):t)+'</span>';
}
function draw(rows,paint){
  return rows.map((row,r)=>{
    const pm=(paint&&paint[r])||'';let out='',buf='',cur='';
    for(let i=0;i<row.length;i++){
      const ch=row.charAt(i);let p=pm.charAt(i)||' ';
      if(p===' ')p=/[0-9^]/.test(ch)?'n':'i';
      if(p==='b')p='b'+ch;
      if(p!==cur){if(buf)out+=cell(cur,buf);buf='';cur=p}
      buf+=ch;
    }
    if(buf)out+=cell(cur,buf);
    return out;
  }).join('\n');
}
const swatch=(s,p)=>draw([s],[(p&&p.length>1)?p:(p||'i').repeat(s.length)]);

/* ---- keys: the names KeyboardEvent.key uses, drawn the way the Kbd demo draws them ---- */
const KEY={ArrowLeft:['<','Left arrow'],ArrowRight:['>','Right arrow'],ArrowUp:['^','Up arrow'],ArrowDown:['v','Down arrow'],
  PageUp:['PgUp','Page Up'],PageDown:['PgDn','Page Down'],Escape:['Esc','Escape'],' ':['Space','Space'],Backspace:['Bksp','Backspace']};
const WORD={ArrowLeft:'Left',ArrowRight:'Right',ArrowUp:'Up',ArrowDown:'Down',PageUp:'Page Up',PageDown:'Page Down',Escape:'Esc',' ':'Space'};
const word=k=>k.split('+').map(x=>WORD[x]||x).join(' ');
function kbd(k){
  return k.split('+').map(x=>{const n=KEY[x];return n?'<kbd><span aria-hidden="true">'+esc(n[0])+'</span><span class="vh">'+esc(n[1])+'</span></kbd>':'<kbd>'+esc(x)+'</kbd>'}).join('+<wbr>');
}

/* ---- what the kit says about itself, read from the copy the Code tab prints ---- */
const BTN=['data-aui-open','data-aui-close','data-aui-toast','data-aui-toast-err','data-aui-reset','data-aui-fill'];
const LAYOUT=['row','stack','group','demo'];
/* a kit css block, by name: the component it belongs to, and the selector
   that says that component is in a piece of markup. Blocks several share
   (field, bar, ibtn) belong to none of them */
const PART={button:['s-button','.btn'],check:['s-toggles','.check'],tabs:['s-tabs','.tablist'],card:['s-card','.card'],dialog:['s-card','dialog'],
  sheet:['s-sheet','dialog.sheet'],alert:['s-alert','.alert'],badge:['s-badge','.badge'],avatar:['s-avatar','.avatar'],crumbs:['s-breadcrumb','.crumbs'],
  calendar:['s-calendar','.cal'],pagination:['s-pagination','[data-aui="pagination"]'],dropdown:['s-dropdown','.menu'],tooltip:['s-tooltip','.tip'],
  otp:['s-otp','.otp'],kbd:['s-kbd','kbd'],divider:['s-separator','.sepd,.sepl'],spinner:['s-spinner','[data-aui="spinner"]'],segment:['s-togglegroup','.tgroup'],
  timeline:['s-timeline','.timeline'],toast:['s-toast','.toast'],details:['s-details','.acc'],skeleton:['s-skeleton','.skel']};
/* the keys of the object a behavior returns, at its top level only */
function apiKeys(src){
  const at=src.lastIndexOf('return {');if(at<0)return [];
  const keys=[];let d=0,tok='';
  for(let i=at+7;i<src.length;i++){
    const c=src.charAt(i);
    if(c==='{'){d++;if(d===1){tok='';continue}}
    else if(c==='}'){d--;if(!d)break}
    if(d!==1)continue;
    if(c===','||c==='\n'){tok='';continue}
    tok+=c;const m=/^\s*(?:get |set )?(\w+)\s*[:(]$/.exec(tok);
    if(m){keys.push(m[1]);tok='\u0000'}
  }
  return [...new Set(keys)];
}
/* the parts a component is made of at its top, under wrappers that only lay out */
function roots(frag){
  let els=[...frag.children];
  for(let n=0;n<3;n++){
    const next=[];let went=false;
    els.forEach(e=>{const c=[...e.classList];if((!c.length||c.every(x=>LAYOUT.includes(x)))&&e.children.length&&!/^(DIALOG|BUTTON|INPUT|NAV|OL|UL)$/.test(e.tagName)){next.push(...e.children);went=true}else next.push(e)});
    els=next;if(!went)break;
  }
  return els;
}
/* a selector without its states and pseudo parts: what it styles */
const baseOf=sel=>sel.replace(/:(not|has|is|where)\([^)]*\)/g,'').replace(/::[a-z-]+/g,'')
  .replace(/:(hover|focus-visible|focus-within|focus|active|disabled|checked|modal|placeholder-shown)/g,'')
  .replace(/\[(aria-selected|aria-pressed|aria-current|aria-expanded|aria-disabled|open)[^\]]*\]/g,'')
  .replace(/\.(invalid|good|full|on|off|danger|err|today|past|open)(?![\w-])/g,'').replace(/\s*[+>~]\s*$/,'').trim();
const STATE=[[':hover','hover'],[':focus-visible','focus'],[':focus-within','focus'],[':active','pressed'],[':disabled','disabled'],['.invalid','invalid'],
  ['[aria-selected="true"]','selected'],[':checked','checked'],['[aria-current','current'],['[aria-pressed="true"]','pressed'],['.good','done'],
  ['.full','full'],['.on','on'],['.off','off'],['[open]','open'],['.danger','danger'],['.err','error']];
function facts(sec){
  const html=sec._kitHTML?sec._kitHTML():'',tpl=document.createElement('template');tpl.innerHTML=html;const f=tpl.content;
  const js=A.KIT?A.KIT().js:'',src=n=>A.kitSource?A.kitSource(n):'';
  const watch=((/var WATCH=\[([^\]]*)\]/.exec(js)||[])[1]||'').match(/data-[a-z-]+/g)||[];
  const out={names:[...new Set([...f.querySelectorAll('[data-aui]')].map(e=>e.getAttribute('data-aui')))],
    buttons:BTN.filter(a=>f.querySelector('['+a+']')),roles:[...new Set([...f.querySelectorAll('[role]')].map(e=>e.getAttribute('role')))],
    events:[],keys:[],options:[],calls:[],aria:[],blocks:[],own:[],states:[],madeOf:[]};
  out.names.forEach(n=>{
    const s=src(n);if(!s)return;let m;
    /* emit(el,'change',{...}), or emit(el,now,{...}) with now set from quoted names */
    const ev=/emit\(\w+,('([a-z]+)'|(\w+)),\{([^}]*)\}\)/g;
    while((m=ev.exec(s))){const det=(m[4].match(/(\w+):/g)||[]).map(x=>x.slice(0,-1));
      const nm=m[2]?[m[2]]:((new RegExp('\\b'+m[3]+'=([^;,]*)').exec(s)||[])[1]||'').match(/'([a-z]+)'/g)||[];
      nm.forEach(x=>out.events.push({on:n,name:'aui:'+x.replace(/'/g,''),detail:det}))}
    const ks=/e\.key===?'([^']+)'/g;while((m=ks.exec(s)))out.keys.push(m[1]);
    const kin=/e\.key in K/.test(s)&&/var K=\{([^}]*)\}/.exec(s);if(kin)(kin[1].match(/(\w+):/g)||[]).forEach(x=>out.keys.push(x.slice(0,-1)));
    const op=/'(data-[a-z-]+)'/g;
    while((m=op.exec(s))){const def=(new RegExp("getAttribute\\('"+m[1]+"'\\)\\|\\|(\\d+|'[^']*')").exec(s)||[])[1];
      out.options.push({on:n,name:m[1],def:def?def.replace(/'/g,''):'',live:watch.includes(m[1])})}
    const ar=/setAttribute\('(aria-[a-z]+)'/g;while((m=ar.exec(s)))out.aria.push(m[1]);
    const typed=new RegExp("typed\\('"+n+"'\\)").test(js),keys=apiKeys(s),body=(/window\.ASCIIUI=\{([\s\S]*?)\n\};/.exec(js)||[])[1]||'';
    if(typed)out.calls.push({on:n,name:'ASCIIUI.'+n+'(el)',api:keys});
    else{
      if(new RegExp('[{,\\s]'+n+':').test(body))out.calls.push({on:n,name:'ASCIIUI.'+n+'(el, ...)',api:[]});
      if(keys.length)out.calls.push({on:n,name:'ASCIIUI.get(el)',api:keys});
    }
  });
  ['keys','aria'].forEach(k=>{out[k]=[...new Set(out[k])]});
  const seen=new Set();out.options=out.options.filter(o=>!seen.has(o.name)&&seen.add(o.name));
  /* the css blocks the Code tab prints, and which of them are this component's
     own: their selectors match the parts at its top. The rest are parts */
  const ex=A.codeExtra?A.codeExtra(sec,html):{css:''},css=ex.css||'',re=/^\/\* ==== ([a-z-]+): (.+?) ==== \*\/$/gm,top=roots(f),list=[];let m;
  while((m=re.exec(css)))list.push({name:m[1],sel:m[2].split(' '),at:m.index});
  list.forEach((b,i)=>{b.text=css.slice(b.at,i+1<list.length?list[i+1].at:undefined)});
  const me=sec.getAttribute('aria-labelledby'),near=top.concat(...top.map(e=>[...e.children]));
  const other=b=>PART[b.name]&&PART[b.name][0]!==me;
  const own=list.filter(b=>!other(b)&&b.sel.some(s=>{try{return near.some(e=>e.matches(s))}catch(e){return false}}));
  out.blocks=list.map(b=>b.name);out.own=own.map(b=>b.name);
  out.note=ex.note||'';out.site=/^Site only/.test(out.note);
  /* made of: another component's block, when that component's own selector is in this markup */
  const shows=b=>{try{return !!f.querySelector(PART[b.name][1])}catch(e){return false}};
  out.madeOf=[...new Set(list.filter(b=>other(b)&&shows(b)).map(b=>PART[b.name][0]))];
  /* the states its own css draws, each with the first selector that draws
     it. A rule counts when what it styles is in this markup (the field block
     also holds the textarea's counter), or the kit draws the insides itself */
  const drawn=[...f.querySelectorAll('[data-aui]')].some(e=>!e.children.length&&!/^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName));
  const here=sel=>{const b=baseOf(sel);if(!b)return false;try{return !!f.querySelector(b)}catch(e){return false}};
  const sels=[].concat(...(own.map(b=>b.text.replace(/\/\*[\s\S]*?\*\//g,'')).join('\n').match(/[^{}]+(?=\{)/g)||[]).map(x=>x.split(',').map(y=>y.trim()))).filter(x=>x&&!/^@/.test(x));
  STATE.forEach(s=>{
    if(out.states.some(x=>x.name===s[1]))return;
    const t=s[0].charAt(0)==='.'?new RegExp('\\'+s[0]+'(?![\\w-])'):null;
    const r=sels.find(y=>{const z=y.replace(/:not\([^)]*\)/g,'');return (t?t.test(z):z.includes(s[0]))&&(drawn||here(y))});
    if(r)out.states.push({name:s[1],sel:r});
  });
  return out;
}

/* ---- the model: what is written, then what the kit says that the words left out.
   A row the kit filled in carries 1 at its end ---- */
const said=(list,name)=>list.some(x=>(x[1]+' '+x[2]).includes(name));
function model(sec){
  const id=sec.getAttribute('aria-labelledby'),d=D[id]||{},k=facts(sec),W=A.kitWords||{behave:{},attrs:{}};
  const api=(d.api||[]).map(x=>x.slice(0,3));
  k.names.forEach(n=>{if(!said(api,'data-aui="'+n+'"'))api.push(['attr','data-aui="'+n+'"',cap(W.behave[n]||'wired by ascii-ui.js')+'.',1])});
  k.buttons.forEach(a=>{if(!api.some(x=>x[1].split(' ').includes(a)||(' '+x[2]+' ').includes('`'+a+'`')))api.push(['attr',a,cap(W.attrs[a]||'handled by ascii-ui.js')+'.',1])});
  const loose=[];
  k.options.forEach(o=>{if(said(api,o.name))return;if(o.def)api.push(['attr',o.name+'="'+o.def+'"',o.def+' when missing.'+(o.live?' Followed live.':''),1]);else loose.push(o)});
  if(loose.length)api.push(['attr',loose.map(o=>o.name).join(' '),'Read by the kit'+(loose.every(o=>o.live)?', and followed live.':'.'),1]);
  k.events.forEach(e=>{if(!said(api,e.name))api.push(['event',e.name,'On the '+e.on+' element. `detail`: `{ '+e.detail.join(', ')+' }`.',1])});
  k.calls.forEach(c=>{if(!said(api,c.name.split('(')[0]+(c.api.length?'':'(')))api.push(['call',c.name,c.api.length?c.api.map(x=>'`'+x+'`').join(', ')+'.':'A call of its own on `window.ASCIIUI`.',1])});
  const keys=(d.keys||[]).map(x=>x.slice(0,2)),left=k.keys.filter(x=>!keys.some(r=>r[0].includes(x)));
  if(left.length)keys.push([left,'Handled by ascii-ui.js.',1]);
  const a11y=(d.a11y||[]).map(x=>x.slice(0,2));
  if(!a11y.length){
    if(k.roles.length)a11y.push(['role','`'+k.roles.join('`, `')+'`, in the markup.',1]);
    if(k.aria.length)a11y.push(['kit','Sets `'+k.aria.join('`, `')+'` itself.',1]);
  }
  const states=(d.states||[]).map(x=>x.slice(0,4));
  if(!states.length&&!k.site)k.states.forEach(s=>states.push([s.name,'        ','m','`'+s.sel+'`',1]));
  const see=(d.see||(k.site?[]:k.madeOf)).filter(nameOf);
  return {id:id,name:nameOf(id),written:!!D[id],site:k.site?k.note.split('. ').slice(0,2).join('. ')+'.':'',
    use:d.use||[],avoid:d.avoid||[],anatomy:d.anatomy||null,states:states,keys:keys,a11y:a11y,dos:d.dos||[],api:api,
    see:see,seeAuto:!d.see&&see.length>0,madeOf:k.site?k.madeOf:[],limits:d.limits||[],kit:k};
}
/* the same model as data, for the scripts that print it (qa/reference.py,
   qa/usage.py). The words stay as written, `code` and {s-id} included: the
   markdown keeps the code, llms.txt flattens it */
A.usageModel=function(sec){
  const m=model(sec);
  return JSON.parse(JSON.stringify({id:m.id,name:m.name,written:m.written,site:m.site,use:m.use,avoid:m.avoid,
    anatomy:m.anatomy?{draw:m.anatomy.draw,parts:m.anatomy.parts}:null,
    states:m.states.map(s=>[s[0],s[1],s[3],!!s[4]]),keys:m.keys.map(r=>[r[0].map(word),r[1],!!r[2]]),keyNames:m.keys.map(r=>r[0]),
    a11y:m.a11y.map(r=>[r[0],r[1],!!r[2]]),dos:m.dos,api:m.api.map(r=>[r[0],r[1],r[2],!!r[3]]),
    see:m.see,seeAuto:m.seeAuto,madeOf:m.madeOf,limits:m.limits,kit:m.kit,raw:D[m.id]||null}));
};

/* ---- the panel ---- */
const auto=r=>r?'<span class="u-auto" aria-hidden="true">~</span><span class="vh">From the kit: </span>':'';
function grp(title,cls,items){return '<div class="u-grp"><h3 class="u-h">'+title+'</h3><ul class="u-list '+cls+'">'+items.map(x=>'<li>'+inline(x)+'</li>').join('')+'</ul></div>'}
function disc(key,title,teaser,body){
  return '<details class="u-sec" data-use="'+key+'"><summary><span class="u-sn">'+title+'</span><span class="u-tz" aria-hidden="true">'+esc(teaser)+'</span></summary><div class="u-body">'+body+'</div></details>';
}
function anatomy(a){
  return '<pre class="u-draw" aria-hidden="true">'+draw(a.draw,a.paint)+'</pre>'+
    '<ol class="u-parts">'+a.parts.map((p,i)=>'<li><span class="u-n" aria-hidden="true">'+(i+1)+'</span><p><b>'+esc(p[1])+'</b> <code>'+esc(p[0])+'</code><span class="u-d">'+inline(p[2])+'</span></p></li>').join('')+'</ol>';
}
const states=list=>'<dl class="u-kv u-st">'+list.map(s=>'<dt><span class="u-sw" aria-hidden="true">'+swatch(s[1],s[2])+'</span></dt><dd>'+auto(s[4])+'<b>'+esc(s[0])+'</b> '+inline(s[3])+'</dd>').join('')+'</dl>';
const keys=list=>'<dl class="u-kv u-keys">'+list.map(r=>'<dt>'+r[0].map(kbd).join(' ')+'</dt><dd>'+auto(r[2])+inline(r[1])+'</dd>').join('')+'</dl>';
const tags=list=>'<dl class="u-kv">'+list.map(r=>'<dt>'+esc(r[0])+'</dt><dd>'+auto(r[2])+inline(r[1])+'</dd>').join('')+'</dl>';
const api=list=>'<dl class="u-kv u-api">'+list.map(r=>'<dt>'+esc(r[0])+'</dt><dd><code class="u-nm">'+auto(r[3])+esc(r[1])+'</code><span class="u-d">'+inline(r[2])+'</span></dd>').join('')+'</dl>';
/* the line beside a closed section is a count, the way Limits always was:
   "6 states", "3 keys". A list of names ran past the column and ended in ... */
const count=(n,one,many)=>n+' '+(n===1?one:many);
function keyTeaser(list){
  const w=[];list.forEach(r=>r[0].forEach(k=>{const x=/^Arrow/.test(k)?'arrows':word(k);if(!w.includes(x))w.push(x)}));
  return count(w.length,'key','keys');
}
const chips=ids=>'<p class="u-see">'+ids.map(id=>'<a class="chip" href="'+href(id)+'">'+esc(nameOf(id))+'</a>').join('')+'</p>';
function page(m){
  let h='';
  if(m.site)h+='<p class="u-empty">'+inline(m.site)+' Nothing here to paste.</p>';
  else if(!m.written)h+='<p class="u-empty">Not written yet. What follows is read from the kit (<span class="u-auto">~</span>): true, and terse.</p>';
  if(m.use.length)h+=grp('Use it for','u-yes',m.use);
  if(m.avoid.length)h+=grp('Not for','u-no',m.avoid);
  const S=[];
  if(m.anatomy)S.push(['anatomy','Anatomy',count(m.anatomy.parts.length,'part','parts'),anatomy(m.anatomy)]);
  if(m.states.length)S.push(['states','States',count(m.states.length,'state','states'),states(m.states)]);
  if(m.keys.length)S.push(['keys','Keyboard',keyTeaser(m.keys),keys(m.keys)]);
  if(m.a11y.length)S.push(['a11y','Accessibility',count(m.a11y.length,'note','notes'),tags(m.a11y)]);
  if(m.dos.length)S.push(['dos','Do and don\'t',count(m.dos.length,'pair','pairs'),'<ul class="u-list u-dd">'+m.dos.map(p=>'<li class="u-do"><b>Do</b> '+inline(p[0])+'</li><li class="u-dont"><b>Don\'t</b> '+inline(p[1])+'</li>').join('')+'</ul>']);
  if(m.api.length)S.push(['api','API',count(m.api.length,'entry','entries'),api(m.api)]);
  if(m.limits.length)S.push(['limits','Limits',count(m.limits.length,'thing','things'),'<ul class="u-list u-no">'+m.limits.map(x=>'<li>'+inline(x)+'</li>').join('')+'</ul>']);
  if(S.length)h+='<div class="u-secs">'+S.map(s=>disc.apply(null,s)).join('')+'</div>';
  if(m.madeOf.length)h+='<div class="u-grp"><h3 class="u-h">Made of</h3>'+chips(m.madeOf)+'</div>';
  if(m.see.length)h+='<div class="u-grp"><h3 class="u-h">See also</h3>'+chips(m.see)+'</div>';
  /* a written entry the kit had to finish says so once, at the end */
  if(m.written&&[m.states,m.keys,m.a11y,m.api].some(l=>l.some(r=>r[r.length-1]===1)))h+='<p class="u-empty"><span class="u-auto">~</span> is read from the kit, not written yet.</p>';
  return h;
}
/* built when the tab opens, like Code. Drawn again only when the ramp
   changed, and the sections that were open stay open */
A.usage=function(sec,panel){
  const key=(A.rampString?A.rampString():'')+'|'+sec.getAttribute('aria-labelledby');
  if(panel._uk===key)return;
  const open=[...panel.querySelectorAll('details[open]')].map(d=>d.dataset.use);
  try{
    panel.innerHTML='<div class="use">'+page(model(sec))+'</div>';
    panel._uk=key;
  }catch(e){
    panel.innerHTML='<p class="u-empty">This tab could not be drawn. Preview and Code still work.</p>';
    panel._uk=null;throw e;
  }
  panel.querySelectorAll('details.u-sec').forEach(d=>{
    if(open.includes(d.dataset.use))d.open=true;
    d.addEventListener('toggle',()=>{
      if(A.live&&A.live())(d.open?A.sfx.on:A.sfx.off)();
      if(d.open&&A.decode)A.decode(d.querySelector('.u-body'));
    });
  });
};
})();
