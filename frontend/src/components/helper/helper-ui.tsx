export  function getKeyName(fullName: string) {
    const name = fullName.split(" ");
    const name2 = name[1] ?? "";
    return name[0].charAt(0) + name2.charAt(0);
}