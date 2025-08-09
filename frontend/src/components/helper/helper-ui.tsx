export  function getKeyName(fullName: string) {
    const name = fullName.split(" ");
    return name[0].charAt(0) + name[1].charAt(0);
}