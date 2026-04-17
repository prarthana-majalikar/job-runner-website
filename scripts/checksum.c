#include <stdio.h>

int main(void) {
    char c;
    unsigned int sum=0;
    while((c=getchar()) != EOF) sum+=c;
    printf("%d\n", sum);
}
